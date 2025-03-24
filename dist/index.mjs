// src/routing/auth.ts
import { Router } from "express";

// src/middleware/statusCodes.ts
function sendStatus401(res) {
  return res.set("WWW-Authenticate", `xBasic realm="${process.env.AUTH_NEO4J_AUTH_REALM}"`).status(401).end();
}
function sendStatus405(...allow) {
  return (req, res) => {
    res.set("Allow", allow).status(405).end();
  };
}

// src/errors/errors.ts
var CustomError = class extends Error {
  _code;
  constructor(message, code, options) {
    super(message, options);
    this._code = code;
  }
  getCode() {
    return this._code;
  }
};
var InternalError = class extends CustomError {
  constructor(message, options) {
    super(message, 500, options);
  }
};
var FieldError = class {
  static REQUIRED = "Required";
  static INVALID_AUTH = "Invalid Auth Type.";
  _field;
  _message;
  constructor(field, message) {
    this._field = field;
    this._message = message;
  }
  getField() {
    return this._field;
  }
  getMessage() {
    return this._message;
  }
  toJSON() {
    return { field: this.getField(), message: this.getMessage() };
  }
};
var FieldErrors = class extends CustomError {
  _fieldErrors = [];
  constructor(message, options) {
    super(message, 400, options);
  }
  addFieldError(fieldError) {
    this._fieldErrors.push(fieldError);
  }
  hasFieldErrors() {
    return this._fieldErrors.length > 0;
  }
  getFields() {
    const fields = [];
    for (const fieldError of this._fieldErrors) {
      fields.push(fieldError.toJSON());
    }
    return fields;
  }
};

// src/db/connection.ts
import neo4j from "neo4j-driver";
async function connect(username = process.env.AUTH_NEO4J_NEO4J_USER, password = process.env.AUTH_NEO4J_NEO4J_PWD) {
  const driver = neo4j.driver(
    `bolt://${process.env.AUTH_NEO4J_NEO4J_HOST}:${process.env.AUTH_NEO4J_NEO4J_PORT}`,
    neo4j.auth.basic(username, password)
  );
  try {
    await driver.getServerInfo();
  } catch (error) {
    throw new InternalError("Unauthorized Connection to Driver" /* DB_CONNECTION_UNAUTHORIZED */, { cause: error });
  }
  return driver;
}

// src/users/user.ts
import * as bcrypt from "bcrypt";
var User = class {
  id;
  email;
  auth;
  firstName;
  lastName;
  secondName;
  constructor(user) {
    this.id = user.id;
    this.email = user.email;
    this.auth = user.auth;
    this.firstName = user.firstName;
    this.lastName = user.lastName;
    this.secondName = user.secondName;
  }
};
async function checkPassword(email, password) {
  const driver = await connect();
  const session = driver.session({ database: process.env.AUTH_NEO4J_USERS_DB });
  let user = void 0;
  const match = await session.run(`MATCH (u:User {email: $email}) RETURN u`, { email });
  if (match.records.length === 1) {
    const matchedUser = match.records[0].get(0).properties;
    const pwdMatch = await bcrypt.compare(password, matchedUser.pwd);
    if (pwdMatch) {
      user = new User(matchedUser);
    }
  }
  await driver.close();
  await session.close();
  return user;
}

// src/sessions/session.ts
import crypto from "node:crypto";
function generateSessionToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString("hex");
}
function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

// src/sessions/crud-session.ts
async function createSession(token, email) {
  const sessionId = hashToken(token);
  const expiresAt = /* @__PURE__ */ new Date();
  expiresAt.setDate(expiresAt.getDate() + parseInt(process.env.AUTH_NEO4J_TOKEN_EXPIRATION));
  const driver = await connect();
  const neoSession = driver.session({ database: process.env.AUTH_NEO4J_USERS_DB });
  let match;
  try {
    match = await neoSession.run(
      `MATCH (u:User {email: $email}) CREATE (u)-[:HAS_SESSION {sessionId: $sessionId}]->(s:Session {expiresAt: $expiresAt}) RETURN u`,
      { email, sessionId, expiresAt: expiresAt.toISOString() }
    );
  } catch (error) {
    await neoSession.close();
    await driver.close();
    throw new InternalError("There was an error creating a session" /* COULD_NOT_CREATE_SESSION */, { cause: error });
  }
  await neoSession.close();
  await driver.close();
  if (match.records.length === 0) {
    return void 0;
  }
  const user = new User(match.records[0].get("u").properties);
  const session = {
    id: sessionId,
    userID: user.id,
    expiresAt
  };
  return session;
}
async function validateSessionToken(token) {
  if (!token) {
    return { session: null, user: null };
  }
  const sessionId = hashToken(token);
  const driver = await connect();
  const neoSession = driver.session({ database: process.env.AUTH_NEO4J_USERS_DB });
  let match;
  try {
    match = await neoSession.run(`MATCH(u:User)-[r:HAS_SESSION {sessionId: $sessionId}]->(s:Session) RETURN u, r, s`, { sessionId });
  } catch (error) {
    await neoSession.close();
    await driver.close();
    throw new InternalError("There was an error validating a session" /* COULD_NOT_VALIDATE_SESSION */, { cause: error });
  }
  await neoSession.close();
  await driver.close();
  if (match.records.length === 0) {
    return { session: null, user: null };
  }
  const user = new User(match.records[0].get("u").properties);
  const session = match.records[0].get("s").properties;
  session.id = match.records[0].get("r").properties.sessionId;
  session.userID = user.id;
  session.expiresAt = new Date(session.expiresAt);
  if (Date.now() >= session.expiresAt.getTime()) {
    await invalidateSession(session.id);
    return { session: null, user: null };
  }
  return { session, user };
}
async function invalidateSession(sessionId) {
  const driver = await connect();
  const neoSession = driver.session({ database: process.env.AUTH_NEO4J_USERS_DB });
  try {
    await neoSession.run(`MATCH (u:User)-[r:HAS_SESSION {sessionId: $sessionId}]->(s:Session) DETACH DELETE s`, { sessionId });
  } catch (error) {
    await neoSession.close();
    await driver.close();
    throw new InternalError("There was an error invalidating a session" /* COULD_NOT_INVALIDATE_SESSION */, { cause: error });
  }
  await neoSession.close();
  await driver.close();
}

// src/routing/routes/auth.ts
async function login(req, res) {
  const { email, password } = req.body;
  const required = new FieldErrors("Invalid Request" /* INVALID_REQUEST */);
  if (!email) required.addFieldError(new FieldError("email", FieldError.REQUIRED));
  if (!password) required.addFieldError(new FieldError("password", FieldError.REQUIRED));
  if (required.hasFieldErrors()) {
    return res.status(required.getCode()).json({ message: required.message, data: required.getFields() }).end();
  }
  const user = await checkPassword(email, password);
  if (user === void 0) {
    return sendStatus401(res);
  }
  const token = generateSessionToken();
  await createSession(token, email);
  return res.status(204).cookie(`token`, token, { httpOnly: true, maxAge: parseInt(process.env.AUTH_NEO4J_COOKIE_EXPIRATION), sameSite: "strict" }).end();
}
async function logout(req, res) {
  const token = req.cookies.token;
  if (!token) {
    return res.status(204).end();
  }
  const svr = await validateSessionToken(token);
  if (svr.session) {
    await invalidateSession(svr.session.id);
  }
  return res.status(204).clearCookie("token").end();
}

// src/routing/auth.ts
var router = Router();
router.get(process.env.AUTH_NEO4J_LOGIN_URI, sendStatus405("POST"));
router.put(process.env.AUTH_NEO4J_LOGIN_URI, sendStatus405("POST"));
router.delete(process.env.AUTH_NEO4J_LOGIN_URI, sendStatus405("POST"));
router.post(process.env.AUTH_NEO4J_LOGIN_URI, login);
router.get(process.env.AUTH_NEO4J_LOGOUT_URI, logout);
router.put(process.env.AUTH_NEO4J_LOGOUT_URI, sendStatus405("GET"));
router.delete(process.env.AUTH_NEO4J_LOGOUT_URI, sendStatus405("GET"));
router.post(process.env.AUTH_NEO4J_LOGOUT_URI, sendStatus405("GET"));
var auth_default = router;

// src/routing/user.ts
import { Router as Router2 } from "express";

// src/auth/auth.ts
var Auth = /* @__PURE__ */ ((Auth2) => {
  Auth2["ADMIN"] = "ADMIN";
  Auth2["CONTRIBUTOR"] = "CONTRIBUTOR";
  Auth2["SELF"] = "SELF";
  return Auth2;
})(Auth || {});
function isValidAuth(auth) {
  return Object.values(Auth).includes(auth);
}
function isRoleEscalation(currentAuth, updatedAuth) {
  return currentAuth === "CONTRIBUTOR" /* CONTRIBUTOR */ && updatedAuth === "ADMIN" /* ADMIN */;
}

// src/middleware/permitRoles.ts
function permitRoles(...rolesPermitted) {
  return async (req, res, next) => {
    const token = req.cookies.token;
    if (!token) {
      return sendStatus401(res);
    }
    const svr = await validateSessionToken(token);
    if (!svr.user) {
      return res.status(403).end();
    }
    if (rolesPermitted.includes(svr.user.auth) || svr.user.id && svr.user.id === req.params.userId && rolesPermitted.includes("SELF" /* SELF */)) {
      return next();
    }
    return sendStatus401(res);
  };
}

// src/users/crud-user.ts
import * as bcrypt2 from "bcrypt";
async function createUser(user, password) {
  const pwdHash = await bcrypt2.hash(password, parseInt(process.env.AUTH_NEO4J_SALT_ROUNDS));
  const driver = await connect();
  const session = driver.session({ database: process.env.AUTH_NEO4J_USERS_DB });
  const props = ["id:apoc.create.uuid()", "email: $email", "auth: $auth", "pwd: $pwdHash"];
  if (user.firstName) props.push("firstName: $firstName");
  if (user.lastName) props.push("lastName: $lastName");
  if (user.secondName) props.push("secondName: $secondName");
  let match;
  try {
    match = await session.run(`CREATE(u:User { ${props.join(",")}}) RETURN u`, { ...user, pwdHash });
  } catch (error) {
    await session.close();
    await driver.close();
    throw new InternalError("There was an error trying to create user." /* COULD_NOT_CREATE_USER */, { cause: error });
  }
  await session.close();
  await driver.close();
  if (match.records.length !== 1) {
    return void 0;
  }
  return new User(match.records[0].get("u").properties);
}
async function getUser(id) {
  const driver = await connect();
  const session = driver.session({ database: process.env.AUTH_NEO4J_USERS_DB });
  let match;
  try {
    match = await session.run(`MATCH (u:User {id: $id}) RETURN u`, { id });
  } catch (error) {
    await session.close();
    await driver.close();
    throw new InternalError("There was an error trying to search for user." /* COULD_NOT_GET_USER */, { cause: error });
  }
  await driver.close();
  await session.close();
  if (match.records.length !== 1) {
    return void 0;
  }
  return new User(match.records[0].get("u").properties);
}
async function deleteUser(id) {
  const driver = await connect();
  const session = driver.session({ database: process.env.AUTH_NEO4J_USERS_DB });
  let match;
  try {
    match = await session.run(`MATCH (u:User {id: $id}) WITH u, properties(u) as p DETACH DELETE u RETURN p`, { id });
  } catch (error) {
    await session.close();
    await driver.close();
    throw new InternalError("There was an error trying to delete user." /* COULD_NOT_DELETE_USER */, { cause: error });
  }
  await session.close();
  await driver.close();
  if (match.records.length !== 1) {
    return void 0;
  }
  return new User(match.records[0].get("p"));
}
async function updateUser(id, userUpdates) {
  const props = [];
  if (userUpdates.updatedPassword) {
    userUpdates.updatedPassword = await bcrypt2.hash(userUpdates.updatedPassword, parseInt(process.env.SALT_ROUNDS));
    props.push(`u.password = $updatedPassword`);
  }
  if (userUpdates.updatedEmail) props.push(`u.email = $updatedEmail`);
  if (userUpdates.updatedFirstName) props.push(`u.firstName = $updatedFirstName`);
  if (userUpdates.updatedLastName) props.push(`u.lastName = $updatedLastName`);
  if (userUpdates.updatedAuth) props.push(`u.auth = $updatedAuth`);
  if (userUpdates.updatedSecondName) props.push(`u.secondName = $updatedSecondName`);
  const driver = await connect();
  const session = driver.session({ database: process.env.AUTH_NEO4J_USERS_DB });
  let match;
  try {
    match = await session.run(`MATCH (u:User {id: $id}) SET ${props.join(",")} RETURN u`, { id, ...userUpdates });
  } catch (error) {
    await session.close();
    await driver.close();
    throw new InternalError("There was an error trying to update user." /* COULD_NOT_UPDATE_USER */, { cause: error });
  }
  await session.close();
  await driver.close();
  if (match.records.length !== 1) {
    return void 0;
  }
  return new User(match.records[0].get("u").properties);
}
async function getAllUsers() {
  const users = [];
  const driver = await connect();
  const session = driver.session({ database: process.env.AUTH_NEO4J_USERS_DB });
  let match;
  try {
    match = await session.run(`MATCH (u:User) RETURN u`);
  } catch (error) {
    await session.close();
    await driver.close();
    throw new InternalError("There was an error trying to search for user." /* COULD_NOT_GET_USER */, { cause: error });
  }
  await session.close();
  await driver.close();
  match.records.map((record) => {
    users.push(new User(record.get("u").properties));
  });
  return users;
}

// src/routing/routes/user.ts
async function getUsers(req, res) {
  const users = await getAllUsers();
  return res.status(200).json(users);
}
async function getUser2(req, res) {
  const { id } = req.params;
  const user = await getUser(id);
  if (!user) {
    return res.status(404).end();
  }
  return res.status(200).json(user).end();
}
async function createUser2(req, res) {
  const { email, auth, firstName, lastName, secondName, password } = req.body;
  const required = new FieldErrors("Invalid Request" /* INVALID_REQUEST */);
  if (!email) required.addFieldError(new FieldError(`email`, FieldError.REQUIRED));
  if (!auth) required.addFieldError(new FieldError(`auth`, FieldError.REQUIRED));
  if (!password) required.addFieldError(new FieldError(`password`, FieldError.REQUIRED));
  if (!isValidAuth(auth)) required.addFieldError(new FieldError(`auth`, FieldError.INVALID_AUTH));
  if (required.hasFieldErrors()) {
    return res.status(required.getCode()).json({ message: required.message, data: required.getFields() }).end();
  }
  const user = await createUser(new User({ email, auth, firstName, lastName, secondName }), password);
  if (user) {
    return res.set("Location", `/${user.id}`).status(201).json(user).end();
  } else {
    return res.status(422).end();
  }
}
async function deleteUser2(req, res) {
  const { id } = req.params;
  const deletedUser = await deleteUser(id);
  if (deletedUser) {
    return res.status(204).end();
  } else {
    return res.status(422).end();
  }
}
async function updateUser2(req, res) {
  const { id } = req.params;
  const { updatedAuth, updatedEmail, updatedFirstName, updatedLastName, updatedSecondName, updatedPassword } = req.body;
  const required = new FieldErrors("Invalid Request" /* INVALID_REQUEST */);
  if (updatedAuth && !isValidAuth(updatedAuth)) required.addFieldError(new FieldError(`updatedAuth`, FieldError.INVALID_AUTH));
  if (required.hasFieldErrors()) {
    return res.status(required.getCode()).json({ message: required.message, data: required.getFields() }).end();
  }
  const user = await getUser(id);
  if (!user) {
    return res.status(404).end();
  }
  if (isRoleEscalation(user.auth, updatedAuth)) {
    return res.status(403).end();
  }
  const updatedUser = await updateUser(id, {
    updatedAuth,
    updatedEmail,
    updatedFirstName,
    updatedLastName,
    updatedPassword,
    updatedSecondName
  });
  if (!updatedUser) {
    return res.status(422).end();
  }
  return res.status(200).json(updatedUser).end();
}

// src/routing/user.ts
var router2 = Router2();
router2.get(`${process.env.AUTH_NEO4J_USER_URI}`, permitRoles("ADMIN" /* ADMIN */), getUsers);
router2.put(`${process.env.AUTH_NEO4J_USER_URI}`, sendStatus405("GET", "POST"));
router2.delete(`${process.env.AUTH_NEO4J_USER_URI}`, sendStatus405("GET", "POST"));
router2.post(`${process.env.AUTH_NEO4J_USER_URI}`, permitRoles("ADMIN" /* ADMIN */), createUser2);
router2.get(`${process.env.AUTH_NEO4J_USER_URI}/:userId`, permitRoles("ADMIN" /* ADMIN */, "SELF" /* SELF */), getUser2);
router2.put(`${process.env.AUTH_NEO4J_USER_URI}/:userId`, permitRoles("ADMIN" /* ADMIN */, "SELF" /* SELF */), updateUser2);
router2.delete(`${process.env.AUTH_NEO4J_USER_URI}/:userId`, permitRoles("ADMIN" /* ADMIN */, "SELF" /* SELF */), deleteUser2);
router2.post(`${process.env.AUTH_NEO4J_USER_URI}/:userId`, sendStatus405("GET", "PUT", "DELETE"));
var user_default = router2;

// src/index.ts
import cookieParser from "cookie-parser";
import express from "express";
async function authNeo4j(config) {
  if (config) {
    process.env.AUTH_NEO4J_SALT_ROUNDS = config.saltRounds;
    process.env.AUTH_NEO4J_TOKEN_SECRET = config.tokenSecret;
    process.env.AUTH_NEO4J_TOKEN_EXPIRATION = config.tokenExpiration;
    process.env.AUTH_NEO4J_COOKIE_EXPIRATION = config.cookieExpiration;
    process.env.AUTH_NEO4J_AUTH_REALM = config.authRealm;
    process.env.AUTH_NEO4J_LOGIN_URI = config.loginURI;
    process.env.AUTH_NEO4J_LOGOUT_URI = config.logoutURI;
    process.env.AUTH_NEO4J_USER_URI = config.userURI;
    process.env.AUTH_NEO4J_NEO4J_HOST = config.neo4jHost;
    process.env.AUTH_NEO4J_NEO4J_PORT = config.noe4jPort;
    process.env.AUTH_NEO4J_NEO4J_USER = config.neo4jUser;
    process.env.AUTH_NEO4J_NEO4J_PWD = config.neo4jPwd;
    process.env.AUTH_NEO4J_USERS_DB = config.usersDB;
  } else if (!config && process.env.NODE_ENV !== "test") {
    process.exit(9);
  }
  const app = express();
  app.use(cookieParser());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(auth_default);
  app.use(user_default);
  return app;
}
var index_default = authNeo4j;
export {
  index_default as default
};
//# sourceMappingURL=index.mjs.map