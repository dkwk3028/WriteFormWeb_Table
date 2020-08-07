import { db } from './firebase.js'
import { app_vue } from './init.js'
import { login } from './login.js'
import { formatDate } from './date.js'

window.uploadClicked = uploadClicked

function uploadClicked(){
    let btn = document.getElementById('upload_btn')
    if (btn.disabled == true){
        return
    }
    btn.disabled = true
    _uploadClicked()
    btn.disabled = false;
}
function _uploadClicked() {
    if (check_datas_empty()){
        return;
    }
    login();
    let user = firebase.auth().currentUser;

    let upload_data = {};
    for (let head of app_vue.first_datas) {
        let key = head.head;
        upload_data[key] = head.data.join(', ')
    }
    upload_data['datas'] = []
    upload_data['avg'] = []
    for (let i = 0; i < app_vue.ROW_COUNT; ++i) {
        let datas = []
        for (let j = 0; j < app_vue.DATA_COUNT; ++j) {
            let data = app_vue.td_datas[i][j]
            datas.push(data)
        }
        upload_data['datas'].push(datas)
    }
    upload_data['avg'] = [...app_vue.avgs]

    const timestamp = Date.now()
    const formatted_time = formatDate(timestamp)

    const title = db.current_form
    upload_data['title'] = title
    upload_data['uid'] = user.uid
    upload_data['timestamp'] = timestamp
    upload_data['time'] = formatted_time

    console.log(upload_data)
    db.pushData('notes/' + title,upload_data)
    app_vue.clearAll();

    app_vue.toggleShow();
    
}

function check_datas_empty() {

    for (let i = 0; i < app_vue.ROW_COUNT; ++i) {
        for (let j = 0; j < app_vue.DATA_COUNT; ++j) {
            let data = app_vue.td_datas[i][j]
            if (data === '') {
                alert('모든 항목을 채워주세요')
                return true;
            }
        }
    }

    for (let head of app_vue.first_datas) {
        for (let data of head.data) {
            if (data == '') {
                alert('모든 항목을 채워주세요')
                return true;
            }
        }
    }
    return false;
}

function removeSpace(str){
    let blank_pattern = /^\s+|\s+$/g;
    return str.replace(blank_pattern, '')
}

function hasSpecial(str){
    let specials = /^.*[\.#\[\]\?\s]+.*/g;
    if (str.match(specials)){
        return true
    }else{
        return false
    }
}
function isEmpty(str){
    if (removeSpace(str) == ''){
        return true;
    }else{
        return false;
    }
}

async function createNoteForm(){
    let btn = document.getElementById('create_note_btn')
    if (btn.disabled == true){
        return;
    }
    btn.disabled = true
    await _createNoteForm()
    btn.disabled = false;
}
async function _createNoteForm(){ 
    let menus1 = document.getElementsByClassName('menu1')
    let menus2 = document.getElementsByClassName('menu2')
    let title = document.getElementById('doc_title').value
    let rows = document.getElementById('doc_row').value
    
    if (isEmpty(title)){
        alert('문서항목이 비어있습니다')
        return
    }
    if (hasSpecial(title)){
        alert('문서에 특수문자 혹은 공백이 들어가있습니다')
        return
    }
    if (isEmpty(rows)){
        alert('행갯수 항목이 비어있습니다')
        return
    }
    if (isNaN(rows)){
        alert('행 갯수가 숫자가 아닙니다')
        return
    }
    rows = parseInt(rows)
    
    let result = {}
    let datas = []
    let cols = 0;
    for (let i=0; i<menus1.length; ++i){
        let vals = [removeSpace(menus1[i].value),
                    removeSpace(menus2[i].value)]
        if (vals.includes('')){
            alert('빈칸이 존재합니다')
            return
        }

        if (isNaN(parseInt(vals[1]))){
            alert('열갯수 항목에 문자열이 존재합니다')
            return
        }
        let rvals = [menus1[i].value, parseInt(menus2[i].value)]
        let data = {'head' : rvals[0], 'col' : rvals[1]}
        cols += rvals[1]
        datas.push(data)

    }
    let b_duplicated = await db.checkNoteDuplicated(title)
    if (b_duplicated){
        alert('문서 이름이 중복되었습니다')
        return
    }
    app_vue.b_modal_show_modify = false;
    result['title'] = title
    result['row'] = rows
    result['col'] = cols
    result['data'] = datas
    console.log(result)
    db.pushNoteForm(result)
    
    
}

window.createNoteForm = createNoteForm;