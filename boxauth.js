const authenticator = {
    authUrl: "https://account.box.com/api/oauth2/authorize",
    tokenUrl: "https://account.box.com/api/oauth2/token",
    client_id: window.location.hostname=="localhost"?"52zad6jrv5v52mn1hfy1vsjtr9jn5o1w":"1n44fu5yu1l547f2n2fgcw7vhps7kvuw",
    client_secret:  window.location.hostname=="localhost"?"2rHTqzJumz8s9bAjmKMV83WHX1ooN4kT":"2ZYzmHXGyzBcjZ9d1Ttsc1d258LiGGVd",
    redirect_url: window.location.origin+window.location.pathname
}

console.log(".. in boxauth.js ")

function step_one(){
    let url = new URL(authenticator.authUrl)
    url.searchParams.append("client_id",authenticator.client_id);
    url.searchParams.append("response_type","code")
    url.searchParams.append("redirect_uri",authenticator.redirect_url)
    window.location.href = url
}

async function step_two(){
    let params = new URLSearchParams(window.location.search)
    let code = params.get("code")

    let fetch_body = {
        code: code,
        grant_type: "authorization_code",
        client_id: authenticator.client_id,
        client_secret: authenticator.client_secret
      }

    let token = await (await fetch(authenticator.tokenUrl, {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-type': 'application/json'
        },
        body: JSON.stringify(fetch_body)
      })).json()
    token.expires_at = Date.now()+1000*token.expires_in
    token.expire_date = new Date(token.expires_at)
    localStorage.setItem("token", JSON.stringify(token))
    window.location.href = authenticator.redirect_url
}

async function oauth(){
    let params=new URLSearchParams(window.location.search)
    if (params.has("code")){
        console.log("... ready for step 2 of the dance...")
        step_two()
    } else{
        console.log("... lets dance ...")
        step_one()
    }
}

export function is_expired(){
    let timestamp = Date.now()
    let token = localStorage.getItem("token")
    if (!token) return true
    token=JSON.parse(token)
    if (timestamp<token.expires_at){
        console.log(`token expires: ${new Date(token.expires_at)}`)
    }else{
        console.warn(`Token Expired at ${new Date(token.expires_at)} ... need to refresh`)
    }
    return timestamp>token.expires_at
}

export function clear_token(){
    delete localStorage.token
}


// authenticate only if needed...
export async function authenticate(){
    let token = localStorage.getItem("token") ?? false
    if (!token) {
        await oauth()
    }else if (is_expired()) {
        await refresh_token()
    }
}

export async function refresh_token(){
    console.log("... Attempting to refresh token ....")
    let token=JSON.parse(localStorage.getItem("token"))

    let fetch_body = {
        refresh_token: token.refresh_token,
        grant_type: "refresh_token",
        client_id: authenticator.client_id,
        client_secret: authenticator.client_secret
      }

    token = await (await fetch(authenticator.tokenUrl, {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-type': 'application/json'
        },
        body: JSON.stringify(fetch_body)
      })).json()
    token.expires_at = Date.now()+1000*token.expires_in
    token.expire_date = new Date(token.expires_at)
    localStorage.setItem("token", JSON.stringify(token))
    //window.location.href = authenticator.redirect_url
    window.location.search=""
}

