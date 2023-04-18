import box from './box.js'
import localforage from 'https://cdn.skypack.dev/localforage';
import papa from 'https://cdn.skypack.dev/papaparse-min';

const study_params = {
    boxBaseURL: "https://api.box.com/2.0/",
    boxFolderURL: "https://nih.app.box.com/folder",
    boxFileURL: "https://nih.app.box.com/file",
    repositoryFolderId: 203776580141
}

let stores = {
    main: await localforage.createInstance({
        name: "charms",
        storeName: "main"
    }),
}

function getToken() {
    let tokenString = localStorage.getItem("token")
    if (!tokenString) return {};
    return JSON.parse(tokenString)
}

async function loadStudies() {
    let studies = await loadFromCache(stores.main, "studies")
    if (!studies) {
        console.log("... unable to load from cache. calling box ...")
        box.setToken(getToken())
        studies = await box.getItems(study_params.repositoryFolderId)
        stores.main.setItem("studies", studies)
    }
    return studies

}

async function loadStudy(boxStudyId) {
    box.setToken(getToken())
    let study = await loadFromCache(stores.main,"studies")
    study = study.entries.reduce( (pv,cv) => (cv.id==boxStudyId?cv.name:pv), ""  )

    // get all the files in the folder...
    if (!stores[boxStudyId]) {
        stores[boxStudyId] = await localforage.createInstance({
            name: "charms",
            storeName: boxStudyId
        })
    }
    let files = await loadFromCache(stores[boxStudyId], "files")
    if (!files) {
        console.log("... unable to load from cache. calling box ...")
        box.setToken(getToken())
        files = await box.getItems(boxStudyId)
        stores[boxStudyId].setItem("files", files)
    }

    return new Promise( async (resolve) => {
        let coreFile={}
        for (const file of files.entries) {
            if (file.type == 'file') {
                let file_info = await loadFromCache(stores[boxStudyId], file.id)
                if (!file_info) {
                    console.log(`Getting content for file ${file.name}`)
                    let csvtext = await box.readFile(file.id)
                    file.data = await parseCSV(csvtext)
                    file.study = study
                    stores[boxStudyId].setItem(file.id, file)
                    if (file.name.includes("core")) coreFile=file;
                } else {
                    console.log(`Already cached content for file ${file.name}`)
                    if (file.name.includes("core")) coreFile=loadFromCache(stores[boxStudyId],file.id);
                }
            }
            
        }
        resolve(coreFile)
    })

}

async function loadFromCache(store, key) {
    if (!store) {
        console.log(`unknown store.... `);
        return false
    }
    return await store.getItem(key)
}

async function clearCache() {
    localforage.dropInstance({
        name: 'charms'
    })
}

async function parseCSV(cstext) {
    return new Promise((resolve) => {
        papa.parse(cstext, {
            header: true,
            skipEmptyLines: true,
            complete: function (results) {
                resolve(results.data)
            }
        })
    })
}


export {
    clearCache,
    loadStudy,
    loadStudies
}

window.clearCache = clearCache
window.loadFromCache = loadFromCache
window.stores = stores