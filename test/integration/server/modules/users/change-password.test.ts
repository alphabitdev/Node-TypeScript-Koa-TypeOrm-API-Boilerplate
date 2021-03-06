import { expect } from 'chai';
import { describe, it, beforeEach } from 'mocha';
import supertest, { SuperTest, Test } from 'supertest';
import { truncateTables } from '../../../database-utils';
import { createUserTest, getLoginToken, testServer, deactivateUser } from '../../../server-utils';

describe('PUT /api/v1/users/password', () => {
  let token: string;
  const app: SuperTest<Test> = supertest(testServer);

  beforeEach(async () => {
    await truncateTables(['user']);

    const user = {
      username: 'dude@gmail.com',
      password: 'secret'
    };

    await createUserTest(user);
    token = await getLoginToken('dude@gmail.com', 'secret');
  });

  it('Should update user password and login successfully', async () => {
    let res = await app
      .put('/api/v1/users/password')
      .set('Authorization', token)
      .send({ newPassword: 'newPassord', oldPassword: 'secret' })
      .expect(204);

    res = await app
      .post('/api/v1/users/login')
      .send({ username: 'dude@gmail.com', password: 'newPassord' })
      .expect(200);

    expect(res.body).keys(['accessToken']);
  });

  it('Should update user password but fail on login', async () => {
    let res = await app
      .put('/api/v1/users/password')
      .set('Authorization', token)
      .send({ newPassword: 'newPassord', oldPassword: 'secret' })
      .expect(204);

    res = await app
      .post('/api/v1/users/login')
      .send({ username: 'dude@gmail.com', password: 'secret' })
      .expect(400);

    expect(res.body.code).equals(30000);
  });

  it('Should return 400 when missing body data', async () => {
    const res = await app
      .put('/api/v1/users/password')
      .set('Authorization', token)
      .send({ newPassword: 'newPassord' })
      .expect(400);

    expect(res.body.code).equals(30001);
    expect(res.body.fields.length).equals(1);
    expect(res.body.fields[0].message).eql('"oldPassword" is required');
  });
  it('Should return 401 when user is not activated', async () => {
    await deactivateUser('dude@gmail.com');
    const res = await app
      .put('/api/v1/users/password')
      .set('Authorization', token)
      .expect(401);

    expect(res.body.code).equals(30002);
  });

  it('Should return 401 when token is not valid', async () => {
    const res = await app
      .put('/api/v1/users/password')
      .set('Authorization', 'wrong token')
      .expect(401);

    expect(res.body.code).equals(30002);
  });

  it('Should return 401 when token is missing', async () => {
    const res = await app.put('/api/v1/users/password').expect(401);

    expect(res.body.code).equals(30002);
  });
});
