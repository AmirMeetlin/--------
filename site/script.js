const app = {
    data() {
        return {
            isAuthenticated: false,
            showSection: 'auth',
            chats: [],
            self: {},
            search: [],
            toggleEnter: false,
            currentChat: {
                messages: [],
                user: {}
            }
        }
    },
    methods: {
        auth() {
            fetch('api/user', {
                method: 'put',
                headers: {
                    'Content-Type': 'application/json;charset=utf-8'
                },
                body: JSON.stringify({ Password: this.$refs.authpassword.value, Username: this.$refs.authlogin.value })
            })
                .then(response => response.json())
                .then(data => {
                    if (data.error) {
                        this.isAuthenticated = false
                        return alert(data.error)
                    } else {
                        this.self = data.user
                        this.isAuthenticated = true
                        this.showSection = 'chat'
                        setTimeout(this.loadChats(), 1000)
                        setTimeout(this.connect(), 3000)
                    }
                });
        },
        reg() {
            if (this.$refs.regpassword.value != this.$refs.regpasswordrep.value) {
                return alert("Пароли не совпадают!")
            }
            else {
                fetch('api/user', {
                    method: 'post',
                    headers: {
                        'Content-Type': 'application/json;charset=utf-8'
                    },
                    body: JSON.stringify({ Password: this.$refs.regpassword.value, Username: this.$refs.reglogin.value, Surname: this.$refs.regsurname.value, Name: this.$refs.regname.value })
                })
                    .then(response => response.json())
                    .then(data => {
                        if (data.error) {
                            this.isAuthenticated = false
                            return alert(data.error)
                        } else {
                            this.isAuthenticated = true
                            this.showSection = 'chat'
                            setTimeout(this.loadChats(), 1000)
                            setTimeout(this.connect(), 3000)
                        }
                    });
            }
        },
        connect(type) {
            fetch(`api/connect${type ? '/' + type : ''}`, {
                method: 'get',
                headers: {
                    'Content-Type': 'application/json;charset=utf-8'
                }
            })
                .then(response => response.json()).then(response => {
                    if (response.error) {
                        console.log(response.error)
                    } else {
                        // console.log(response.message)
                        if (response.message) {
                            let newMessages = []
                            for (let i = 0; i < response.message.length - this.currentChat.messages.length; i++) {
                                newMessages.push(response.message[i])
                            }
                            console.log(newMessages)
                            newMessages.forEach(message => {
                                this.currentChat.messages.unshift(message)
                            })

                        }
                        if (response.chats) {
                            this.chats = response.chats.map(item => {
                                item.Time = new Date(item.Time).toLocaleString("RU", {
                                    weekday: 'long',
                                    month: 'long',
                                    day: 'numeric', hour: 'numeric',
                                    minute: 'numeric'
                                }).replaceAll(',', "")
                                return item
                            })
                            this.currentChat.User = response.chats.find(item => item.ID == this.currentChat.User.ID)
                        }
                        this.connect('reload')
                    }
                })
                .catch(err => { this.connect('reload') })
        },
        sendMessage() {
            if (this.toggleEnter) {
                return
            }
            if (this.$refs.messagefield.value.trim().length != 0) {
                fetch(`api/message/${this.currentChat.user.Username}`, {
                    method: 'post',
                    headers: {
                        'Content-Type': 'application/json;charset=utf-8'
                    },
                    body: JSON.stringify({ Message: this.$refs.messagefield.value })
                })
                    .then(response => response.json())
                    .then(data => {
                        if (data.error) {
                            return alert(data.error)
                        } else {
                            this.$refs.messagefield.value = ""
                        }
                    });
            }
        },
        loadChats() {
            fetch('api/chats', { method: 'get' })
                .then(response => response.json())
                .then(data => {
                    if (data.error) {
                        this.isAuthenticated = false
                        return alert(data.error)
                    } else {
                        this.chats = data.map(item => {
                            console.log()
                            item.Time = new Date(item.Time).toLocaleString("RU", {
                                weekday: 'long',
                                month: 'long',
                                day: 'numeric', hour: 'numeric',
                                minute: 'numeric'
                            }).replaceAll(',', "")
                            return item
                        })
                    }
                })
        },
        setViewedMessage() {

        },
        searchUsers() {
            if (this.$refs.seachfield.value.length > 0) {
                fetch(`api/user/search?search=${this.$refs.seachfield.value}`,
                    {
                        method: 'get', headers: { 'Content-Type': 'application/json;charset=utf-8' }
                    })
                    .then(response => response.json()).then(data => {
                        if (data.error) {
                            alert(data.error)
                        } else {
                            this.search = data.filter(item => item.ID != this.self.ID)
                        }
                    })
            } else {
                this.search = []
            }
        },
        selectChat(user) {
            console.log(user)
            this.currentChat.user = user
            this.loadMessages(user)
        },
        loadMessages(user) {
            fetch(`api/message/${user.Username}`, {
                method: 'get',
                headers: {
                    'Content-Type': 'application/json;charset=utf-8'
                }
            })
                .then(response => response.json()).then(data => {
                    if (data.error) {
                        alert(data.error)
                    } else {
                        console.log(data)
                        this.currentChat.messages = data.message
                    }
                })
        },
        exit() {
            fetch('api/user', { method: 'delete' })
                .then(response => response.json())
                .then(data => {
                    this.isAuthenticated = false
                    this.showSection = 'auth'
                });
        }
    },
    mounted() {
        fetch('api/user', { method: 'get' })
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    this.isAuthenticated = false
                } else {
                    this.self = data.user
                    this.isAuthenticated = true
                    this.showSection = 'chat'
                    setTimeout(this.loadChats(), 1000)
                    setTimeout(this.connect(), 3000)
                }
            });
    }
}
Vue.createApp(app).mount('#app')
