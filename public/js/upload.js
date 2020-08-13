import { db } from './firebase.js'
import { app_vue } from './init.js'
import { login } from './login.js'
import { formatDate } from './date.js'

window.uploadClicked = uploadClicked

//업로드 함수 Wrapper
function uploadClicked() {
    let btn = document.getElementById('upload_btn')
    if (btn.disabled == true) {
        return
    }
    btn.disabled = true
    _uploadClicked()
    btn.disabled = false;
}

/*
업로드 함수.
1. 항목을 모두 채웠는지 체크.
2. login 되어있는지 체크.
3. 쉼표가 들어가있는 항목이 있는지 체크. csv 출력시 값에 쉼표가 들어가면 오류발생의 여지가 있기때문 
4. notes/title/uid  경로에 push 한다.
5. 만약 지난 기록에서 수정을 한 경우라면, updateData 함수를 이용하여 notes/title/uid/prev_push_key 경로에 update한다. (덮어쓰기)
*/
function _uploadClicked() {
    if (check_datas_empty()) {
        return;
    }

    let user = firebase.auth().currentUser;
    if (user == null) {
        alert('로그인이 되어있지 않습니다')
        return
    }
    let upload_data = {};
    for (let head of app_vue.first_datas) {
        let key = head.head;
        let temp_array = head.data.filter((datax)=>{return datax.includes(',')})
        if (temp_array.length != 0){
            alert('쉼표가 들어간 항목이 있습니다')
            return
        }
        upload_data[key] = head.data.join('、')
    }
    upload_data['datas'] = []
    upload_data['avg'] = []
    for (let i = 0; i < app_vue.ROW_COUNT; ++i) {
        let datas = []
        for (let j = 0; j < app_vue.DATA_COUNT; ++j) {
            let data = app_vue.td_datas[i][j]

            if (j == app_vue.DATA_COUNT - 1){
                if (data.includes(',')){
                    alert('쉼표가 들어간 항목이 있습니다')
                    return
                }
            }
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
    for (let i = 0; i < 1; ++i) {
        if (app_vue.b_prev_data_show){
            db.updateData('notes/' + title + '/' + user.uid + '/' + app_vue.selected_prev_data.push_key, upload_data)
        }else{
            db.pushData('notes/' + title + '/' + user.uid, upload_data)
        }
    }

    if (app_vue.b_prev_data_show){
        app_vue.cancelPrevData()
    }else{
        app_vue.clearAll();

        app_vue.toggleShow();
    }


    

}

function check_datas_empty() {

    for (let i = 0; i < app_vue.ROW_COUNT; ++i) {
        for (let j = 0; j < app_vue.DATA_COUNT; ++j) {
            let data = app_vue.td_datas[i][j]
            if (j != (app_vue.DATA_COUNT -1) && data === '') {
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

// 공백제거
export function removeSpace(str) {
    let blank_pattern = /^\s+|\s+$/g;
    return str.replace(blank_pattern, '')
}

//  . # [ ] ? 이 있는가 검사.
export function hasSpecial(str) {
    let specials = /^.*[\.#\[\]\?\s]+.*/g;
    if (str.match(specials)) {
        return true
    } else {
        return false
    }
}

export function isEmpty(str) {
    if (removeSpace(str) == '') {
        return true;
    } else {
        return false;
    }
}


// 양식 만들기 함수 Wrapper
async function createNoteForm() {
    let btn = document.getElementById('create_note_btn')
    if (btn.disabled == true) {
        return;
    }
    btn.disabled = true
    await _createNoteForm()
    btn.disabled = false;
}

/*
양식 만들기 함수

firebase.js 에 있는 Database db 객체의 pushNoteForm을 이용하여 양식을 업로드한다.

경로는 note_form/list/title이고, setCurrentForm을 통해 note_form/current_form/title을 수정해 현재 양식을 바꾼다.
*/
async function _createNoteForm() {
    let menus1 = document.getElementsByClassName('menu1')
    let menus2 = document.getElementsByClassName('menu2')
    let check_boxs = document.getElementsByClassName('modal_apply_check_box')
    let title = document.getElementById('doc_title').value
    let rows = document.getElementById('doc_row').value

    if (isEmpty(title)) {
        alert('문서항목이 비어있습니다')
        return
    }
    if (hasSpecial(title)) {
        alert('문서에 특수문자 혹은 공백이 들어가있습니다')
        return
    }
    if (isEmpty(rows)) {
        alert('행갯수 항목이 비어있습니다')
        return
    }
    if (isNaN(rows)) {
        alert('행 갯수가 숫자가 아닙니다')
        return
    }
    rows = parseInt(rows)

    let result = {}
    let datas = []
    let cols = 0;
    for (let i = 0; i < menus1.length; ++i) {
        let vals = [removeSpace(menus1[i].value),
            removeSpace(menus2[i].value)
        ]
        if (vals.includes('')) {
            alert('빈칸이 존재합니다')
            return
        }

        if (isNaN(parseInt(vals[1]))) {
            alert('열갯수 항목에 문자열이 존재합니다')
            return
        }
        let check_data = check_boxs[i].checked;
        let rvals = [menus1[i].value, parseInt(menus2[i].value)]
        let data = { 'head': rvals[0], 'col': rvals[1], 'checks' : check_data}
        cols += rvals[1]
        datas.push(data)

    }
    let b_duplicated = await db.checkNoteDuplicated(title)
    if (b_duplicated) {
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