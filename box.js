console.log(" ... in box.js ...")
const box = {
    baseURL: "https://api.box.com/2.0",
    token: "",
    setToken: function(token){
        this.token=token
    },

    getItems: async function (folderId){        
        let url = `${this.baseURL}/folders/${folderId}/items`
        let headers = new Headers()
        headers.append('Authorization',`Bearer ${this.token.access_token}`)
        headers.append('Content-Type','application/json')
        headers.forEach(h=>console.log(h))

        let items= await (await fetch(url,{headers:headers})).json()
        return items;
    },

    readFile: async function(fileId){
        let url = `${this.baseURL}/files/${fileId}/content?access_token=${this.token.access_token}`
        return await (await fetch(url)).text()
    }
}

export default box
window.box=box
