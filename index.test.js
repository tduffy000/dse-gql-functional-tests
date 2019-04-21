/* eslint-disable no-console */
import gql from 'graphql-tag';

import ApolloClient from 'apollo-client';
import { createHttpLink } from 'apollo-link-http';
import { InMemoryCache } from 'apollo-cache-inmemory';
import fetch from 'node-fetch';
import { create } from 'handlebars';

// redefine as needed
const SERVER_URI = 'http://localhost:4000/';
const badTokenError = 'GraphQL error: Bad Token';
const ADMIN_EMAIL = 'admin@example.com';
const ADMIN_PASSWORD = 'password';

const makeClient = ({ uri = SERVER_URI, token = null } = {}) => {
  const linkOptions = {
    uri,
    fetch,
    headers: {
      authorization: token,
    },
  };

  return new ApolloClient({
    link: createHttpLink(linkOptions),
    cache: new InMemoryCache(),
  });
};

const loginUser = async (
  client = makeClient(),
  { email = ADMIN_EMAIL, password = ADMIN_PASSWORD } = {},
) => {
  const loginUserMutation = gql`
    mutation LoginUser($email: String!, $password: String!) {
      loginUser(email: $email, password: $password) {
        token
        user {
          id
        }
      }
    }
  `;
  const result = await client.mutate({
    mutation: loginUserMutation,
    variables: { email, password },
  });

  const { token } = result.data.loginUser;
  return makeClient({ token });
};

const logoutUser = async (client) => {
  const logoutUserMutation = gql`
    mutation {
      logoutUser
    }
  `;

  const result = await client.mutate({ mutation: logoutUserMutation });
  return result.data.logoutUser;
};

const sayHello = async (client) => {
  const q = gql`
    query {
      hello
    }
  `;
  const result = await client.query({ query: q });
  return result.data;
};

const listUsers = async (client) => {
  const q = gql`
    query {
      users {
        id
        name
        email
        role
      }
    }
  `;
  const result = await client.query({ query: q });
  return result.data;
};

const listStudents = async (client) => {
  const q = gql`
    query {
      students {
        id
        name
        email
        role
        courses {
          id
          name
        }
      }
    }
  `;
  const result = await client.query({ query: q });
  return result.data;
};

const getCurrentUser = async (client) => {
  const q = gql`
    query {
      currentUser {
        id
        name
        email
        role
      }
    }
  `;
  const result = await client.query({ query: q });
  return result.data;
};

// can the server say hello?
describe('Hello Tests', () => {
  let client;

  beforeAll(() => {
    client = makeClient();
  });

  it('should say hello', async () => {
    const r = await sayHello(client);
    expect(r).toEqual({ hello: 'world' });
  });
});

describe('Login Tests', () => {
  let client;

  beforeAll(() => {
    client = makeClient();
  });

  it('should login user', async () => {
    const newClient = await loginUser(client);
    expect(newClient).toBeDefined();
  });

  it('should not login a user with invalid credentials', async () => {
    try {
      const newClient = await loginUser(client, { email: 'bad@example.com', password: 'bad' });
      expect(newClient).not.toBeDefined();
    } catch (e) {
      console.log(e.message);
      expect(e.message).toEqual('GraphQL error: Bad Login or Password');
    }
  });

  it('should not list users without login', async () => {
    expect.assertions(1);
    try {
      const result = await listUsers(client);
    } catch (e) {
      expect(e.message).toEqual(badTokenError);
    }
  });

  it('should not retrieve current user without login', async () => {
    expect.assertions(1);
    try {
      await getCurrentUser(client);
    } catch (e) {
      expect(e.message).toEqual(badTokenError);
    }
  });
});

describe('Logout Tests', () => {
  let client;

  beforeAll(async () => {
    client = await loginUser();
  });

  it('should logout a logged in user', async () => {
    const result = await logoutUser(client);
    expect(result).toEqual(true);
  });
});

describe('Invalid Logout Tests', () => {
  let client;

  beforeAll(async () => {
    client = await makeClient();
  });

  it('should not log out a user without an existing session', async () => {
    expect.assertions(1);
    try {
      const result = await logoutUser(client);
      expect(result).toEqual();
    } catch (e) {
      expect(e.message).toEqual(badTokenError);
    }
  });
});

describe('Retrieve current user', async () => {
  let client;

  beforeAll(async () => {
    client = await loginUser();
  });

  it('should get the current user', async () => {
    const result = await getCurrentUser(client);
    const { currentUser } = result;

    expect(currentUser.email).toEqual(ADMIN_EMAIL);
  });
});

describe('List Users', () => {
  let client;

  beforeAll(async () => {
    client = await loginUser();
  });

  it('should list users', async () => {
    const result = await listUsers(client);
    expect(result.users.length).toBeGreaterThan(0);
    const { users } = result;
    const u = users[0];
    for (const attr of ['id', 'email', 'role', 'name']) {
      expect(u[attr]).toBeDefined();
    }
  });

  it('should list students', async () => {
    const result = await listStudents(client);
    expect(result.students.length).toBeGreaterThan(0);
    const { students } = result;
    const s = students[0];

    for (const attr of ['id', 'email', 'role', 'name']) {
      expect(s[attr]).toBeDefined();
    }
  });

  it.todo('should list faculty');

  it.todo('should get a single user');

  it.todo('should get a student');
});

describe('User Creation', () => {
  let client;
  beforeAll(async () => {
    client = await loginUser();
  });

  it.todo('should create a user');
});

describe('Enforce student authorization', () => {
  it.todo('should not let student create a user');
});

describe('Enforce faculty authorization', () => {
  it.todo('should not let a faculty create a user');
});
