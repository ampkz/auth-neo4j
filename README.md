# @ampkz/auth-neo4j

Simple Express middleware for session and user management using Neo4j.

## Setup

### Create/Modify .env

Create (or modify) a `.env` file in your project's root directory with the following keys (see [below](#env-keys) for an explanation of the keys and the supplied default values):

```
SALT_ROUNDS=10
SESSION_EXPIRATION=15
COOKIE_EXPIRATION=1296000
AUTH_REALM=CHANGE_ME
LOGIN_URI=/login
LOGOUT_URI=/logout
USER_URI=/user
NEO4J_HOST=localhost
NEO4J_PORT=7687
NEO4J_USER=neo4j
NEO4J_PWD=CHANGE_ME
USERS_DB=users.authneo4j
```

Make sure your `.gitignore` file includes your `.env` file.

### Initialize Database and Initial User (TypseScript Example)

```js
import { User } from '@ampkz/auth-neo4j/user';
import { Auth } from '@ampkz/auth-neo4j/auth';
import { initializeDB, initUser } from '@ampkz/auth-neo4j/db';

async function initializeAuthNeo4j() {
    await initializeDB();

    const user: User = new User(email: 'your@email.com', auth: Auth.ADMIN);

    await initUser(user, 'your password');
}

initializeAuthNeo4j();
```

### Integrate with Express

```js
import authNeo4j from '@ampkz/auth-neo4j';
import express from 'express';

const app = express();
const port = 3000;

app.use(authNeo4j());

app.listen(port, () => {
	console.log(`Example app listening on port ${port}`);
});
```

### (Optional) Configure the Logger

This middleware uses [winston](https://www.npmjs.com/package/winston) as the logger and can be configured accordingly.

For example:

```js
import logger from '@ampkz/auth-neo4j/logger';
import { transports } from 'winston';

// Remove the console transport
logger.remove(logger.transports[0]);

// Add a file transport
logger.add(new winston.transports.File({ filename: 'app.log' }));
```

## Server Requirements

### Neo4j

The server requires Neo4j v2025.08 Enterprise. You can get a Neo4j enterprise license through their [startup program](https://neo4j.com/startup-program/ 'Neo4j Startup Program').

Follow the instructions below to install Neo4j, being sure to install the correct version (2025.08.0):

- [Install Neo4j:](https://neo4j.com/docs/operations-manual/current/installation/linux/debian/ 'Neo4j')
    - Add Neo4j's repository:
        ```bash
        wget -O - https://debian.neo4j.com/neotechnology.gpg.key | sudo gpg --dearmor -o /etc/apt/keyrings/neotechnology.gpg
        echo 'deb [signed-by=/etc/apt/keyrings/neotechnology.gpg] https://debian.neo4j.com stable latest' | sudo tee -a /etc/apt/sources.list.d/neo4j.list
        sudo apt-get update
        ```
    - Enable `universe` repository
        ```bash
        sudo add-apt-repository universe
        ```
    - Install Neo4j Enterprise Edition:
        ```bash
        sudo apt-get install neo4j-enterprise=1:2025.08.0
        ```
        You will be prompted to accept the license agreement. If you obtained a license through the Neo4j Startup Program, select option '3'; otherwise, select '2'.
- [Set Initial Password:](https://neo4j.com/docs/operations-manual/current/configuration/set-initial-password/ 'Neo4j Set Initial Password')
  Before starting neo4j, you need to set an initial password (replacing newPassword with your password):

    ```bash
    cd /bin
    neo4j-admin dbms set-initial-password newPassword
    ```

    - In your `.env` file, update the key `NEO4J_PWD=CHANGE_ME` to your new password.

- [Install the APOC Plugin:](https://neo4j.com/docs/apoc/current/installation/ 'Install the APOC plugin')
    - Move or copy the APOC jar file from the `$NEO4J_HOME/labs` directory to the `$NEO4J_HOME/plugins` directory:
        ```bash
        sudo cp /var/lib/neo4j/labs/apoc-2025.08.0-core.jar /var/lib/neo4j/plugins
        ```
    - Start Neo4j:
        ```bash
        sudo neo4j start
        ```
- Enable Neo4j on startup:

    Try:

    ```bash
    sudo systemctl start neo4j
    sudo systemctl status neo4j
    ```

    If it failed to start, saying that the configuration file validation failed, you may need to change ownership of the folder where the logs are kept:

    ```bash
    sudo chown neo4j -R /var/log/neo4j
    ```

    After changing the folder's owner, try to start the neo4j service and check its status again. If successful, enable neo4j to start on startup:

    ```bash
    sudo systemctl enable neo4j
    ```

    If unsuccessful, make sure `/etc/neo4j` and `/var/lib/neo4j` are owned by `neo4j`.

## .env keys

```
SALT_ROUNDS=10
```

Salt value passed to bcrypt's hashing function. The default value is 10.

```
SESSION_EXPIRATION=15
```

The number of days before the session expires. The default is 15 days.

```
COOKIE_EXPIRATION=1296000
```

The number of seconds before the cookie expires. The default is 1296000 (15 days).

```
AUTH_REALM=CHANGE_ME
```

The [realm](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/WWW-Authenticate#realm) set on HTTP 401 Unauthorized errors. This value should be changed appropriately.

```
LOGIN_URI=/login
```

The URI pointing to the login enpoint for the API. The default is `/login`.

```
LOGOUT_URI=/logout
```

The URI pointing to the logout endpoint for the API. The default is `/logout`.

```
USER_URI=/user
```

The URI pointing to the user management endpoint for the API. The default is `/user`.

```
NEO4J_HOST=localhost
```

The host value for the Neo4j database. The default value is `localhost`.

```
NEO4J_PORT=7687
```

The port value for the Neo4j database. The default value is `7687`.

```
NEO4J_USER=neo4j
```

The username for the Neo4j database. The default value is `neo4j`.

```
NEO4J_PWD=CHANGE_ME
```

The password for the Neo4j database. This value should be changed appropriately.

```
USERS_DB=users.authneo4j
```

The users database name. The default value is `users.authneo4j`. This value will change depending on the NODE_ENV set. Specifically, the NODE_ENV will be appended to the value (i.e., if the NODE_ENV is `development` this value will have `.development` appended to whatever value is set here, the default being `users.autheneo4j.development`).

## Open Source (GPLv3) License

    Copyright (C) 2025 Andrew M. Pankratz

    This program is free software: you can redistribute it and/or modify it under the terms of the GNU General
    Public License as published by the Free Software Foundation, either version 3 of the License, or (at your
    option) any later version.

    This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the
    implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.

    See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
