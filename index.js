const app = require('express')()
const PORT = 3000
const db = require('./database.js')
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')
const md5 = require("md5");

app.use(cookieParser())
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json())

let connectedUsers = []

const AuthGuard = async (cookies) => {
    if (cookies.token) {
        return await db.query(`SELECT *
                           FROM "User"
                           WHERE "Token" = '${cookies.token.trim().substring(0, 32)}'`).then(res => {
            if (res.rowCount == 1) {
                return [true]
            } else {
                return [false, "Пользователь не существует"]
            }
        })
    } else {
        return [false, "Вы не авторизированы!"]
    }
}

const notifyConnectedUser = async (id, type) => {
    if (Array.isArray(id)) {
        await id.forEach((iduser) => {
            const item = connectedUsers.filter(user => user.id == iduser)
            if (item.length > 0) {
                if (type == 'message') {
                    try {
                        db.query(`SELECT * FROM (SELECT DISTINCT ON ("U"."ID") "U"."ID", "U"."Username", "U"."Name", "U"."Surname", "M"."Text", "M"."Time", "M"."HasViewed", "U"."HasOnline" FROM "User" AS "U" INNER JOIN "Message" AS "M" ON ("M"."IDUserSender" = "U"."ID" OR "M"."IDUserRecipient" = "U"."ID") AND "M"."IDUserSender" != "M"."IDUserRecipient" WHERE "M"."IDUserSender" = ${item[0].id} OR "M"."IDUserRecipient" = ${item[0].id} GROUP BY "U"."ID", "M"."Text", "M"."Time", "M"."HasViewed" ORDER BY "U"."ID", "M"."Time" DESC) AS "Chat" WHERE "Chat"."ID" != ${item[0].id} ORDER BY "Chat"."Time" DESC`).then(async chats => {
                            await db.query(`SELECT *
                            FROM "Message"
                            WHERE "IDUserSender" = ${id[0]} AND "IDUserRecipient" = ${id[1]}
                               OR "IDUserSender" = ${id[1]} AND "IDUserRecipient" = ${id[0]}
                            ORDER BY "Time" DESC`).then(messages => {
                                item[0].res.send({ chats: chats.rows, message: messages.rows })
                            })
                        })
                    } catch (e) {
                        console.log(e)
                    }
                }
            }
        })
    } else {
        const item = connectedUsers.filter(user => user.id == id)
        if (item.length > 0) {
            if (type == 'connect') {
                if (item) {
                    db.query(`SELECT * FROM (SELECT DISTINCT ON ("U"."ID") "U"."ID", "U"."Username", "U"."Name", "U"."Surname", "M"."Text", "M"."Time", "M"."HasViewed", "U"."HasOnline" FROM "User" AS "U" INNER JOIN "Message" AS "M" ON ("M"."IDUserSender" = "U"."ID" OR "M"."IDUserRecipient" = "U"."ID") AND "M"."IDUserSender" != "M"."IDUserRecipient" WHERE "M"."IDUserSender" = ${id} OR "M"."IDUserRecipient" = ${id} GROUP BY "U"."ID", "M"."Text", "M"."Time", "M"."HasViewed" ORDER BY "U"."ID", "M"."Time" DESC) AS "Chat" WHERE "Chat"."ID" != ${id} ORDER BY "Chat"."Time" DESC`).then(async chats => {
                        chats.rows.forEach(chat => {
                            let connectedUser = connectedUsers.filter(user => user.id == chat.ID)
                            if (connectedUser.length > 0) {
                                connectedUser = connectedUser[0]
                                db.query(`SELECT * FROM (SELECT DISTINCT ON ("U"."ID") "U"."ID", "U"."Username", "U"."Name", "U"."Surname", "M"."Text", "M"."Time", "M"."HasViewed", "U"."HasOnline" FROM "User" AS "U" INNER JOIN "Message" AS "M" ON ("M"."IDUserSender" = "U"."ID" OR "M"."IDUserRecipient" = "U"."ID") AND "M"."IDUserSender" != "M"."IDUserRecipient" WHERE "M"."IDUserSender" = ${connectedUser.id} OR "M"."IDUserRecipient" = ${connectedUser.id} GROUP BY "U"."ID", "M"."Text", "M"."Time", "M"."HasViewed" ORDER BY "U"."ID", "M"."Time" DESC) AS "Chat" WHERE "Chat"."ID" != ${connectedUser.id} ORDER BY "Chat"."Time" DESC`).then(async chats => {
                                    connectedUser.res.send({ chats: chats.rows })
                                    connectedUsers = connectedUsers.filter(item => item.id != connectedUser.id)
                                })
                            }
                        })
                    })
                }
            } else if (type == 'disconnect') {
                connectedUsers = connectedUsers.filter(item => item.id != id)
                db.query(`SELECT * FROM (SELECT DISTINCT ON ("U"."ID") "U"."ID", "U"."Username", "U"."Name", "U"."Surname", "M"."Text", "M"."Time", "M"."HasViewed", "U"."HasOnline" FROM "User" AS "U" INNER JOIN "Message" AS "M" ON ("M"."IDUserSender" = "U"."ID" OR "M"."IDUserRecipient" = "U"."ID") AND "M"."IDUserSender" != "M"."IDUserRecipient" WHERE "M"."IDUserSender" = ${id} OR "M"."IDUserRecipient" = ${id} GROUP BY "U"."ID", "M"."Text", "M"."Time", "M"."HasViewed" ORDER BY "U"."ID", "M"."Time" DESC) AS "Chat" WHERE "Chat"."ID" != ${id} ORDER BY "Chat"."Time" DESC`).then(async chats => {
                    chats.rows.forEach(chat => {
                        let connectedUser = connectedUsers.filter(user => user.id == chat.ID)
                        if (connectedUser.length > 0) {
                            connectedUser = connectedUser[0]
                            db.query(`SELECT * FROM (SELECT DISTINCT ON ("U"."ID") "U"."ID", "U"."Username", "U"."Name", "U"."Surname", "M"."Text", "M"."Time", "M"."HasViewed", "U"."HasOnline" FROM "User" AS "U" INNER JOIN "Message" AS "M" ON ("M"."IDUserSender" = "U"."ID" OR "M"."IDUserRecipient" = "U"."ID") AND "M"."IDUserSender" != "M"."IDUserRecipient" WHERE "M"."IDUserSender" = ${connectedUser.id} OR "M"."IDUserRecipient" = ${connectedUser.id} GROUP BY "U"."ID", "M"."Text", "M"."Time", "M"."HasViewed" ORDER BY "U"."ID", "M"."Time" DESC) AS "Chat" WHERE "Chat"."ID" != ${connectedUser.id} ORDER BY "Chat"."Time" DESC`).then(async chats => {
                                connectedUser.res.send({ chats: chats.rows })
                                connectedUsers = connectedUsers.filter(item => item.id != connectedUser.id)
                            })
                        }
                    })
                })
            }
        }
    }
}

const connectUser = async (id, req, res) => {
    await db.query(`SELECT * FROM "User" WHERE "ID" = ${id}`).then(async (result) => {
        if (result.rowCount != 0) {
            await db.query(`UPDATE "User" SET "HasOnline" = TRUE WHERE "ID" = ${id}`).then(() => {
                connectedUsers = connectedUsers.filter(item => item.id != id)
                connectedUsers.push({ id: id, req: req, res: res })
                if (!req.params.type) {
                    notifyConnectedUser(id, 'connect')
                }
            })
        }
    })
}
const disconnectUser = async (id) => {
    await db.query(`SELECT * FROM "User" WHERE "ID" = ${id}`).then(async (result) => {
        if (result.rowCount != 0) {
            await db.query(`UPDATE "User" SET "HasOnline" = FALSE WHERE "ID" = ${id}`).then(() => {
                notifyConnectedUser(id, 'disconnect')
            })
        }
    })
}

app.get('/', (req, res) => {
    res.sendFile(`${__dirname}\\site\\index.html`)
})
app.get('/style.css', function (req, res) {
    res.sendFile(`${__dirname}\\site\\style.css`);
});
app.get('/script.js', function (req, res) {
    res.sendFile(`${__dirname}\\site\\script.js`);
});
app.get('/api/user', async (req, res) => {
    if (await AuthGuard(req.cookies).then(r => r[0])) {
        await db.query(`SELECT *
                    FROM "User"
                    WHERE "Token" = '${req.cookies.token.trim().substring(0, 32)}'`).then(result => {
            res.send({ user: result.rows[0] })
        })
    } else {
        await AuthGuard(req.cookies).then(r => res.send(JSON.stringify({ error: r[1] })))
    }
})
app.put('/api/user/', async (req, res) => {
    if (req.body.Password && req.body.Username) {
        if (await AuthGuard(req.cookies).then(r => r[0])) {
            res.send(JSON.stringify({ error: 'Вы уже авторизированы!' }))
        } else {
            await db.query(`SELECT * FROM "User" WHERE "Token" = '${md5(req.body.Password.toLowerCase() + req.body.Username.toLowerCase())}'`).then(async result => {
                if (result.rowCount > 0) {
                    res.cookie('token', md5(req.body.Password.toLowerCase() + req.body.Username.toLowerCase()), {
                        maxAge: 900000000,
                        httpOnly: true
                    });
                    res.send({ user: result.rows[0] })
                } else {
                    res.send(JSON.stringify({ error: 'Неверный логин или пароль!' }))
                }
            })
        }
    } else {
        res.send(JSON.stringify({ error: 'Недостаточно данных!' }))
    }
})
app.post('/api/user', async (req, res) => {
    if (await AuthGuard(req.cookies).then(r => r[0])) {
        res.send({ error: "Вы уже авторизированы!" })
    } else {
        if (req.body?.Name && req.body?.Surname && req.body?.Password && req.body?.Username) {
            await db.query(`SELECT *
                      FROM "User"
                      WHERE "Username" = '${req.body.Username.trim()}'`).then(async result => {
                if (result.rowCount > 0) {
                    res.send({ error: "Пользователь уже зарегистрирован!" })
                } else {
                    await db.query(`INSERT INTO "User" ("Name", "Surname", "Token", "Username")
                          VALUES ('${req.body.Name}', '${req.body.Surname}',
                                  '${md5(req.body.Password.toLowerCase() + req.body.Username.toLowerCase())}', '${req.body.Username.trim()}')
                                  `).then(() => {
                        res.cookie('token', md5(req.body.Password.toLowerCase() + req.body.Username.toLowerCase()), {
                            maxAge: 900000000,
                            httpOnly: true
                        });
                        db.query(`SELECT * FROM "User" WHERE "Token" = '${md5(req.body.Password.toLowerCase() + req.body.Username.toLowerCase())}'`).then(result => {
                            res.send({ user: result.rows[0] })
                        })
                    })
                }
            })
        } else {
            res.send({ error: "Не хватает данных для регистрации!" })
        }
    }
})
app.get('/api/user/search', async (req, res) => {
    if (await AuthGuard(req.cookies).then(r => r[0])) {
        if (req.query.search) {
            await db.query(`SELECT "ID", "Name", "Username", "Surname", "HasOnline"
                    FROM "User"
                    WHERE POSITION(LOWER('${req.query.search}') IN LOWER("Username")) > 0
                        OR POSITION(LOWER('${req.query.search}') IN LOWER(Concat("Name", ' ', "Surname"))) >
                           0`).then(result => {
                res.send(result.rows)
            })
        } else {
            res.send({ error: 'не хватает данных!' })
        }
    } else {
        await AuthGuard(req.cookies).then(r => res.send(JSON.stringify({ error: r[1] })))
    }
})
app.get('/api/message/:username', async (req, res) => {
    if (req.params?.username) {
        if (await AuthGuard(req.cookies).then(r => r[0])) {
            await db.query(`SELECT *
                      FROM "User"
                      WHERE "Token" = '${req.cookies.token.trim().substring(0, 32)}'`).then(async UserSender => {
                await db.query(`SELECT *
                        FROM "User"
                        WHERE "Username" = '${req.params.username}'`).then(async UserRecipient => {
                    if (UserRecipient.rowCount > 0) {
                        await db.query(`SELECT *
                            FROM "Message"
                            WHERE "IDUserSender" = ${UserSender.rows[0].ID} AND "IDUserRecipient" = ${UserRecipient.rows[0].ID}
                               OR "IDUserSender" = ${UserRecipient.rows[0].ID} AND "IDUserRecipient" = ${UserSender.rows[0].ID}
                            ORDER BY "Time" DESC`).then(messages => {
                            res.send({ message: messages.rows })
                        })
                    } else {
                        res.send({ error: 'пользователь не найден!' })
                    }
                })
            })
        } else {
            await AuthGuard(req.cookies).then(r => res.send(JSON.stringify({ error: r[1] })))
        }
    } else {
        res.send({ error: 'username не указан!' })
    }
})
app.put('/api/message/:id', async (req, res) => {
    if (req.params?.id) {
        if (await AuthGuard(req.cookies).then(r => r[0])) {
            await db.query(`SELECT *
                      FROM "User"
                      WHERE "Token" = '${req.cookies.token.trim().substring(0, 32)}'`).then(async User => {
                await db.query(`SELECT *
                        FROM "Message"
                        WHERE "IDUserSender" = '${User.rows[0].ID}'
                           OR "IDUserRecipient" = '${User.rows[0].ID}'`).then(async message => {
                    if (message.rowCount > 0) {
                        await db.query(`UPDATE "Message"
                            SET "HasViewed" = TRUE
                            WHERE "ID" = ${message.rows[0].ID}`).then(() => {
                            res.send({ info: 'сообщение просмотрено!' })
                        })
                    } else {
                        res.send({ error: 'id сообщения не верен!' })
                    }
                })
            })
        } else {
            await AuthGuard(req.cookies).then(r => res.send(JSON.stringify({ error: r[1] })))
        }
    } else {
        res.send({ error: 'id сообщения не указан!' })
    }
})
app.post('/api/message/:username', async (req, res) => {
    if (req.params.username) {
        if (req.body.Message) {
            if (await AuthGuard(req.cookies).then(r => r[0])) {
                await db.query(`SELECT * FROM "User" WHERE "Token" = '${req.cookies.token.trim().substring(0, 32)}'`).then(async UserSender => {
                    await db.query(`SELECT * FROM "User"  WHERE "Username" = '${req.params.username}'`).then(async UserRecipient => {
                        if (UserRecipient.rowCount > 0) {
                            await db.query(`INSERT INTO "Message" ("Text", "IDUserSender", "IDUserRecipient") VALUES ('${req.body.Message.substring(0, 8000)}', ${UserSender.rows[0].ID}, ${UserRecipient.rows[0].ID})`).then((n) => {
                                res.send({ info: 'сообщение отправлено!' })
                                notifyConnectedUser([UserSender.rows[0].ID, UserRecipient.rows[0].ID], 'message')
                            })
                        } else {
                            res.send({ error: 'пользователь не найден!' })
                        }
                    })
                })
            } else {
                await AuthGuard(req.cookies).then(r => res.send(JSON.stringify({ error: r[1] })))
            }
        } else {
            res.send({ error: 'сообщение не указано!' })
        }
    } else {
        res.send({ error: 'username не указан!' })
    }
})
app.get('/api/chats', async (req, res) => {
    if (await AuthGuard(req.cookies).then(r => r[0])) {
        await db.query(`SELECT *
                    FROM "User"
                    WHERE "Token" = '${req.cookies.token.trim().substring(0, 32)}'`).then(async UserSender => {
            await db.query(`SELECT *
                      FROM (SELECT DISTINCT
                            ON ("U"."ID") "U"."ID", "U"."Username", "U"."Name", "U"."Surname", "M"."Text", "M"."Time", "M"."HasViewed", "U"."HasOnline"
                            FROM "User" AS "U" INNER JOIN "Message" AS "M"
                            ON ("M"."IDUserSender" = "U"."ID" OR "M"."IDUserRecipient" = "U"."ID") AND "M"."IDUserSender" != "M"."IDUserRecipient"
                            WHERE "M"."IDUserSender" = ${UserSender.rows[0].ID} OR "M"."IDUserRecipient" = ${UserSender.rows[0].ID}
                            GROUP BY "U"."ID", "M"."Text", "M"."Time", "M"."HasViewed"
                            ORDER BY "U"."ID", "M"."Time" DESC) AS "Chat"
                      WHERE "Chat"."ID" != ${UserSender.rows[0].ID}
                      ORDER BY "Chat"."Time" DESC`).then(messages => {
                res.send(messages.rows)
            })
        })
    } else {
        await AuthGuard(req.cookies).then(r => res.send(JSON.stringify({ error: r[1] })))
    }
})
app.get('/api/connect/:type?', async (req, res) => {
    if (await AuthGuard(req.cookies).then(r => r[0])) {
        await db.query(`SELECT * FROM "User" WHERE "Token" = '${req.cookies.token.trim().substring(0, 32)}'`).then(async result => {
            await connectUser(result.rows[0].ID, req, res)
            await req.on('close', async () => {
                await disconnectUser(result.rows[0].ID)
            })
        })
    } else {
        await AuthGuard(req.cookies).then(r => res.send(JSON.stringify({ error: r[1] })))
    }
})
app.delete('/api/user/', async (req, res) => {
    res.cookie('token', '0', {
        maxAge: 1,
        httpOnly: true
    });
    res.send({ info: 'куки удалена' })
})

app.listen(PORT, () => {
    console.log(`server started on port: ${PORT}`)
    db.checkConnection()
})
