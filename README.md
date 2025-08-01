# auth-neo4j

Simple Express middleware for session and user management using Neo4j.

## Server Requirements

### Neo4j

The server requires Neo4j v5.26.1 Enterprise. You can get a Neo4j enterprise license through their [startup program](https://neo4j.com/startup-program/ 'Neo4j Startup Program').

#### Example Installation on Ubuntu 24.04

Follow the instructions below to install Neo4j on Ubuntu 24.04, being sure to install the correct version (5.26.1):

- [Install Neo4j:](https://neo4j.com/docs/operations-manual/current/installation/linux/debian/ 'Neo4j')
    - Add OpenJDK's repository:
        ```bash
        sudo add-apt-repository -y ppa:openjdk-r/ppa
        sudo apt update
        ```
    - Add Neo4j's repository:
        ```bash
        wget -O - https://debian.neo4j.com/neotechnology.gpg.key | sudo gpg --dearmor -o /etc/apt/keyrings/neotechnology.gpg
        echo 'deb [signed-by=/etc/apt/keyrings/neotechnology.gpg] https://debian.neo4j.com stable 5' | sudo tee -a /etc/apt/sources.list.d/neo4j.list
        sudo apt update
        ```
    - Enable `universe` repository
        ```bash
        sudo add-apt-repository universe
        ```
    - Install Neo4j Enterprise Edition:
        ```bash
        sudo apt install neo4j-enterprise=1:5.26.1
        ```
        You will be prompted to accept the license agreement. If you obtained a license through the Neo4j Startup Program, select option '3'; otherwise, select '2'.
- [Set Initial Password:](https://neo4j.com/docs/operations-manual/2025.01/configuration/set-initial-password/ 'Neo4j Set Initial Password')
  Before starting neo4j, you need to set an initial password (replacing newPassword with your password):

    ```bash
    cd /bin
    neo4j-admin dbms set-initial-password newPassword
    ```

    - In your `.env` file, update the key `NEO4J_PWD=CHANGE_ME` to your new password.

- [Install the APOC Plugin:](https://neo4j.com/docs/apoc/current/installation/ 'Install the APOC plugin')
    - Move or copy the APOC jar file from the `$NEO4J_HOME/labs` directory to the `$NEO4J_HOME/plugins` directory:
        ```bash
        sudo cp /var/lib/neo4j/labs/apoc-5.26.1-core.jar /var/lib/neo4j/plugins
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
    sudo chown neo4j:adm -R /var/log/neo4j
    ```

    After changing the folder's owner, try to start the neo4j service and check its status again. If successful, enable neo4j to start on startup:

    ```bash
    sudo systemctl enable neo4j
    ```

    If unsuccessful, make sure `/etc/neo4j` and `/var/lib/neo4j` are owned by `neo4j:adm`.

### .env keys

```bash
SALT_ROUNDS=10
```

Salt value passed to bcrypt's hashing function. The default value is 10.

```bash
SESSION_EXPIRATION=15
```

The number of days before the session expires. The default is 15 days.

```bash
COOKIE_EXPIRATION=1296000
```

The number of seconds before the cookie expires. The default is 1296000 (15 days).

```bash
AUTH_REALM=CHANGE_ME
```

The [realm](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/WWW-Authenticate#realm) set on HTTP 401 Unauthorized errors. This value should be changed appropriately.

```bash
LOGIN_URI=/login
```

The URI pointing to the login enpoint for the API. The default is `/login`.

```bash
LOGOUT_URI=/logout
```

The URI pointing to the logout endpoint for the API. The default is `/logout`.

```bash
USER_URI=/user
```

The URI pointing to the user management endpoint for the API. The default is `/user`.

```bash
NEO4J_HOST=localhost
```

The host value for the Neo4j database. The default value is `localhost`.

```bash
NEO4J_PORT=7687
```

The port value for the Neo4j database. The default value is `7687`.

```bash
NEO4J_USER=neo4j
```

The username for the Neo4j database. The default value is `neo4j`.

```bash
NEO4J_PWD=CHANGE_ME
```

The password for the Neo4j database. This value should be changed appropriately.

```bash
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
