export const LOGIN = "LOGIN"

export class DocServerAPI {
    constructor(url) {
        this.url = url
        this.listeners = {}
    }
    on(type, cb) {
        if (!this.listeners[type]) this.listeners[type] = []
        this.listeners[type].push(cb)
    }

    off(type, cb) {
        if (this.listeners[type])
            this.listeners[type] = this.listeners[type].filter(c => c !== cb)
    }
    fire(type, payload) {
        if (!this.listeners[type]) this.listeners[type] = []
        this.listeners[type].forEach(cb => cb(payload))
    }
    isLoggedIn() {
        if (localStorage.getItem('access-token')) return true
        return false
    }
    startLogin() {
        console.log("starting to do the login")
        let auth_url = `${this.url}auth/github/`
        this.win = window.open(auth_url, '_blank')
        window.addEventListener('message', this.authCallback)
        if (this.win) this.win.focus()
    }
    startLogout() {
        localStorage.clear()
        this.fire(LOGIN, {})
    }
    authCallback = (msg) => {
        console.log("got the auth callback", msg.data)
        localStorage.setItem('access-token', msg.data.payload.accessToken)
        localStorage.setItem('username', msg.data.payload.username)
        this.win.close()
        window.removeEventListener('message', this.authCallback)
        this.fire(LOGIN, {})
    }
    getAccessToken() {
        return localStorage.getItem('access-token')
    }
    getUsername() {
        return localStorage.getItem('username')
    }
    list(type) {
        let url = `${this.url}/docs/${this.getUsername()}/search?type=${type}`;
        return this._fetch(url).then(res => res.json()).then(res => {
            console.log("got a list",res)
            return res
        })
    }
    save(doc) {
        let doc_text = JSON.stringify(doc, null, 4);
        console.log("saving now",doc_text)
        let params = {
            type:'meowsynth',
            mimetype:'application/json',
            title:doc.title?doc.title:'untitled',
        }
        let query = '?'+ Object.keys(params).map(key => key+'='+params[key]).join("&")

        return this._fetch(`${this.url}/docs/${this.getUsername()}/upload/${query}`,{
            method:'POST',
            body:doc_text,
            headers: {
                'Content-Type':'application/json'
            }
        }).then(res=>res.json())
    }
    _fetch(url, options={}) {
        options.mode = 'cors'
        options.cache = 'no-cache'
        if (!options.headers) options.headers = {}
        options.headers["access-key"] = this.getAccessToken()
        console.log("fetching", url, 'with options', options)
        return fetch(url, options)
            .then(res => {
                if (res.status === 404) throw new Error(res.statusText + " " + res.url)
                return res
            })
    }
    load(id) {
        let url = `${this.url}/docs/${this.getUsername()}/data/${id}/latest/application/json/data.json`
        return fetch(url,{
            method:'GET',
            headers: {
                'Content-Type':'application/json'
            }
        })
            .then(res => {
                if (res.status === 404) throw new Error(res.statusText + " " + res.url)
                return res
            }).then(res => res.json()).then(res => {
                console.log("the load result is",res)
                return res
            })
    }
    delete(id) {
        let params = {
            type:'meowsynth',
            mimetype:'application/json',
            _id:id,
        }
        let query = '?'+ Object.keys(params).map(key => key+'='+params[key]).join("&")
        let url = `${this.url}/docs/${this.getUsername()}/delete/${query}`
        this._fetch(url, {
            method:'POST'
        }).then(res => res.json())
            .then(res => {
                console.log("final result",res)
            })
    }
}
