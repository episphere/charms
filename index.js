import { refresh_token, clear_token, is_expired, authenticate } from "./boxauth.js"
import { loadStudy, loadStudies, clearCache } from "./familyStudy.js"

let current_data=[]

let refreshButton=document.getElementById("refresh")
let clearButton=document.getElementById("clear")
let studiesButton=document.getElementById("studies")
let clearDataButton=document.getElementById("data")

let table_info ={
    numRows: 10,
    start: 0,
    data: []
}
window.table_info=table_info;

let hasToken = !!localStorage.getItem("token")
refreshButton.style.display=(hasToken)?"default":"null";
clearButton.style.display=(hasToken)?"default":"null";
clearDataButton.addEventListener("click",clearCache)

refreshButton.addEventListener("click",refresh_token);
clearButton.addEventListener("click",(event) => {
    clear_token()
    refreshButton.style.display='none'
    clearButton.style.display='none'
});

// we dont already have a token...
if (!hasToken || is_expired()){
    console.log('... authenticating ...')
    authenticate()
} 

async function selectStudy(event){
    document.body.style.cursor='progress'
    document.getElementById("status").innerText='loading study ...'
    let boxFileId=document.getElementById("studies").value
    if (boxFileId == -1) return
    console.log(` ... load study ${boxFileId} ...`)
    let coreFile = await loadStudy(boxFileId)
    table_info.data = coreFile.data;
    table_info.start = 0;
    table_info.file_name = coreFile.name
    table_info.study = coreFile.study
    window.data = table_info.data
    renderTable()
    document.body.style.cursor='default'
}
document.getElementById("studies").onchange = selectStudy

async function load_studies_in_option(){
    document.getElementById("status").innerText='loading studies ...'
    let element = document.getElementById("studies")
    let studies = await loadStudies()
    studies.entries.forEach( (study)=>{
        // we MAY have to filter folders only...
        //console.log(study)
        element.insertAdjacentHTML('beforeend',`<option value='${study.id}'>${study.name}</option>`)
    })
    document.getElementById("status").innerText='ready ...'
}

await load_studies_in_option()


function nextPage(event){
    table_info.start= Math.min(table_info.start+table_info.numRows,Math.max(0,table_info.data.length-table_info.numRows) )
    renderTable()
}
function prevPage(event){
    table_info.start= Math.max(table_info.start-table_info.numRows,0 )
    renderTable()
}
function setNRows(event){
    table_info.numRows=Number.parseInt(event.target.value)
    console.log(`setting nrows to ${table_info.numRows}`)
    renderTable()
}
function renderTable(){
    if (table_info.data.length==0) return;
    document.getElementById("status").innerText='rendering the table ...'

    const tableElement = document.getElementById("data-table")
    const tableTitle = document.getElementById("studyname")
    tableTitle.innerText=table_info.study;

    tableElement.innerText=""
    const colNames = Object.keys(data[1])
    // buildHead...
    let thead = tableElement.createTHead()
    let row = thead.insertRow()
    let cell=row.insertCell()
    cell.outerHTML=`<th>Row</th>`
    colNames.forEach( (colName) =>{
        cell=row.insertCell()
        cell.outerHTML=`<th>${colName}</th>`
    })

    let tbody = tableElement.createTBody()

    let start=table_info.start
    let maxRow = Math.min(table_info.data.length,table_info.start+table_info.numRows)

    for (let i=start;i<maxRow;i++){
        row = tbody.insertRow();
        cell = row.insertCell();
        cell.innerText=i+1;
        colNames.forEach( (colName) => {
            cell = row.insertCell()
            cell.innerText= table_info.data[i][colName]
        })
    }
    let tfoot = tableElement.createTFoot()
    row = tfoot.insertRow()
    cell = row.insertCell();
    cell.colSpan = colNames.length+1
    cell.insertAdjacentHTML("beforeend",
    `<div class="d-flex flex-row align-items-center">
    <span class="mx-3">    
    <label for="rowsPP">Rows per Page:</label>
    <select id="rowsPP">
    <option value="10" ${table_info.numRows==10?"selected":""}>10</option>
    <option value="25" ${table_info.numRows==25?"selected":""}>25</option>
    <option value="50" ${table_info.numRows==50?"selected":""}>50</option>
    <option value="100" ${table_info.numRows==100?"selected":""}>100</option>
    </select>
    </span>
    <span class="mx-3"> ${start+1} - ${maxRow} of ${table_info.data.length}</span>
    <span class="mx-3">
    <label for="jumpToRow">Jump to Row:</label>
    <input type="number" id="jumpToRow" min=0 max="${table_info.data.length-1}">
    </span>
    <nav class="mx-3">
       <ul class="pagination pagination-sm py-0 my-0">
          <li class="page-item"><a id="tbl-prev" class="page-link"><span>&laquo;</span></a></li>
          <li class="page-item"><a id="tbl-next" class="page-link"><span>&raquo;</span></a></li>
        </ul>
    </nav>
    </div>
    `)
    document.querySelector("#tbl-prev").addEventListener("click",prevPage)
    document.querySelector("#tbl-next").addEventListener("click",nextPage)
    document.querySelector("#rowsPP").addEventListener("change",setNRows)
    document.querySelector("#jumpToRow").addEventListener("input",(event)=>{
        console.log(event)
    })
    document.querySelector("#jumpToRow").addEventListener("keyup",(event)=>{
        if (event.key=='Enter'){
            let minRow = Math.max(0,Number.parseInt(event.target.value)-1)
            table_info.start = Math.min(minRow,Math.max(0,table_info.data.length-table_info.numRows) )
            renderTable()
        }
    })
    document.getElementById("status").innerText='ready ...'
}