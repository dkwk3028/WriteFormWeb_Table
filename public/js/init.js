import { db } from "./firebase.js";
import { login } from "./login.js";
import {removeSpace, isEmpty, hasSpecial} from "./upload.js"

const EMPTY_DATA = 0
export var app_vue;


/*
app_vue는 vue object 입니다.

app_vue.init 를 통해  app_vue 가 가진 값들을 초기화 해줄수 있습니다.
보통 업데이트를 한 이후 새로 기록을 받아와서 다시 새로 값을 넣어야할때 호출해주는 모습을 볼 수 있습니다.

app_vue.clearAll은 좀더 작은단위의 초기화이고, 항목들을 초기화 시켜주고, 평균값 부분도 초기화 시켜줍니다.

db.init를 호출하면 서버에서 최신 기록을 받아오고, app_vue.init를 실행해줍니다. db는 firebase에 선언된 Database 객체입니다.

이외의 함수들은 별 다른 내용이없고, html과 연동되는 함수들입니다..
-------------------------------------------------------------------
주요 변수들)

td_datas => 항목들에 해당하는 값들이 [[],[],[],...] 의 2d array 형태로 들어 있습니다.
first_datas = > Location과 Writer에 해당하는 값들이 [{},{}] 의 형태로 들어있으며, 'data' : [] 에 값이 저장됩니다
avgs => 평균값이 저장됩니다.
header_keys => 양식의 항목들 정보가 들어있습니다.  'head'는 열의 이름, 'col'은 열 갯수입니다.

b_modal_show_... => 각 modal box를 보여줄지 결정하는 boolean 변수들 입니다.  보통 showModal~ 의 형식을 이용해서 b_modal_show_... 를 true로 만들어 보여주고, closeModal~의 형식을 이용해서 
b_modal_show를 false로 만듭니다.

DATA_COUNT : Note를 포함한 col 갯수입니다. 처음 app_vue에서 설정된 값은 아무런 효과가 없고  db.init에서 app_vue.DATA_COUNT 가 초기화됩니다.
ROW_COUNT : 행 갯수입니다. 마찬가지로 db.init에서 초기화됩니다.
*/
window.onload = function() {

    //vue object 생성
    app_vue = new Vue({
        el: '#app',
        data: {
            DATA_COUNT: 6,
            ROW_COUNT: 16,
            prev_row: 16,
            page_show: false,
            b_page_show: false,
            b_modal_show: false,
            b_modal_show_head: false,
            b_modal_show_left: false,
            b_modal_show_modify: false,
            b_modal_avg: false,
            b_modify: false,
            b_modify_block: false,
            b_modal_show_load: false,
            b_modal_show_prev: false,
            b_prev_data_show: false,
            b_modal_show_csv: false,
            b_possible_load_more: true,
            b_modal_show_download_btn: false,
            b_modal_show_col: false,
            b_modal_show_add_col_btn: false,
            download_note_form: null,
            temp_td_datas: {},
            prev_datas: [],
            td_datas: [],
            check_boxs : [],
            note_form_loads: [],
            modify_col_number: 0,
            selected_prev_data : null,
            header_keys: [
                { 'head': 'Length', 'col': 1,'checks':false },
                { 'head': 'Count_No.', 'col': 1,'checks':false },
                { 'head': 'SPAD', 'col': 3, 'checks':true },
                { 'head': 'Panicle No.', 'col': 1,'checks':false },
            ],
            colspans: [

            ],
            checked: false,
            check_boxs: [

            ],
            headers: [],
            first_datas: [
                { 'head': 'Location', 'heads': ['Location1','Location2'], 'data': ['', ''] },
                { 'head': 'Writer', 'heads': ['Writer'], 'data': [''] }
            ],
            avgs: [],
            
            row_num: 0
        },
        methods: {
            closeModalDownloadBtn: function() {
                this.b_modal_show_download_btn = false;
            },
            showDownloadBtn: function() {
                this.b_modal_show_download_btn = true;
            },
            showModalByCol: function(event){
                if (this.b_modify && !this.b_prev_data_show) {
                    return
                }
                let td = event.target
                let class_name = td.className
                class_name = class_name.replace(/^bycol\d+-/g,'')
                let col_number = parseInt(class_name)
                console.log(this.check_boxs[col_number])
                if (this.check_boxs[col_number]){
                    this.showModal(event);
                    return;
                }
                this.modify_col_number = col_number
                this.b_modal_show_col = true
            },
            closeModalByCol: function(){
                this.b_modal_show_col = false
            },
            showModal: function(event) {

                if (this.b_modify) {
                    return
                }
                this.b_modal_avg = false
                let tr = event.target;
                let tag_name = tr.tagName.toLowerCase();
                if (tag_name == 'td') {
                    tr = tr.parentElement;
                }

                let tds = tr.childNodes;
                console.log(tds[0].innerText)
                if (isNaN(tds[0].innerText)) {
                    this.b_modal_avg = true;
                } else {
                    let row_num = parseInt(tds[0].innerText) - 1;
                    this.row_num = row_num;
                }
                this.b_modal_show = true;


            },
            showModalLeft: function(event) {
                if (this.b_modify) {
                    return
                }
                this.b_modal_show_left = true;
            },
            showModalLoad: function(event) {
                this.closeModalLeft()

                if (!this.b_modal_show_csv)
                    this.b_modal_show_load = true
                this.note_form_loads = []
                db.readNoteForms()
            },
            showModalPrev: function(event) {
                db.page_key = ''
                this.prev_datas = []
                db.readNoteLists()


                this.b_modal_show_prev = true;

            },
            loadMore: function(e) {
                if (e && e.target)
                    document.activeElement.blur()
                if (!this.b_possible_load_more) {
                    return
                }
                this.b_possible_load_more = false;

                db.readNoteLists()
            },
            removeCard: function(prev_data) {
                db.removeNode(`notes/${db.current_form}/${prev_data.uid}/${prev_data.push_key}`)
                db.page_key = ''
                this.prev_datas = []
                db.readNoteLists()
            },
            showPrevData: function(prev_data) {
                this.closeModalLeft()
                this.closeModalPrev()

                this.temp_td_datas = {}
                this.temp_td_datas['Location'] = this.first_datas[0].data
                this.temp_td_datas['Writer'] = this.first_datas[1].data

                this.temp_td_datas['td_datas'] = [...this.td_datas]
                this.temp_td_datas['ROW_COUNT'] = this.ROW_COUNT;
                this.temp_td_datas['Avg'] = [...this.avgs]

                this.first_datas[0].data = prev_data.Location.split('、')
                this.first_datas[1].data = prev_data.Writer.split('、')

                let modifyed_prev_data_datas = []
                const prev_data_col = prev_data.datas[0].length
                if (prev_data_col < this.DATA_COUNT){
                    for (let row_index=0; row_index < prev_data.datas.length; ++row_index){
                        let note_col_arr = prev_data.datas[row_index].splice(prev_data_col-1,1)
                        let row_data = [...prev_data.datas[row_index], ...Array(this.DATA_COUNT - prev_data_col).fill(0),note_col_arr[0]]
                        console.log(row_data)
                        modifyed_prev_data_datas.push(row_data)
                    }
                    prev_data.datas = modifyed_prev_data_datas
                    prev_data.avg.push(...Array(this.DATA_COUNT - prev_data_col).fill(0))

                    console.log(prev_data.avg)
                    console.log(prev_data.datas)
                }
                this.td_datas = prev_data.datas
                this.avgs = prev_data.avg

                //this.DATA_COUNT = prev_data.datas[0].length + 1
                this.ROW_COUNT = prev_data.datas.length

                this.b_modify = true
                this.b_prev_data_show = true
                this.b_possible_load_more = true
                
                this.selected_prev_data = prev_data
            },
            cancelPrevData: function() {
                this.first_datas[0].data = this.temp_td_datas['Location']
                this.first_datas[1].data = this.temp_td_datas['Writer']
                this.td_datas = [...this.temp_td_datas['td_datas']]
                this.avgs = [...this.temp_td_datas['Avg']]
                this.ROW_COUNT = this.temp_td_datas['ROW_COUNT']
                this.b_modify = false
                this.b_prev_data_show = false
                this.toggleShow()
            },
            showModalHead: function(event) {
                if (this.b_modify && !this.b_prev_data_show) {
                    return
                }
                let td = event.target;
                if (td.id == 'location') {
                    this.row_num = 0;
                } else if (td.id == 'writer') {
                    this.row_num = 1;
                }
                this.b_modal_show_head = true;
            },
            showModalModify: function(event) {
                this.b_modal_show_left = false;
                this.b_modal_show_modify = true;
            },
            closeModalPrev: function() {
                this.b_modal_show_prev = false;
            },
            closeModalLoad: function() {
                this.b_modal_show_load = false;
                this.b_modal_show_csv = false;
            },
            closeModalModify: function() {
                this.b_modal_show_modify = false;
            },
            closeModal: function() {
                this.b_modal_show = false;
            },
            closeModalHead: function() {
                this.b_modal_show_head = false;
            },
            closeModalLeft: function() {
                this.b_modal_show_left = false;
            },
            saveModal: function() {
                for (let i = 0; i < this.DATA_COUNT; ++i) {
                    let input_tag = document.getElementById(`modal_input${i}`)
                    let apply_col = document.getElementById(`apply_col_box${i}`)
                    let val;
                    if (i != (this.DATA_COUNT-1)){
                        val = parseFloat(input_tag.value);
                    }else{
                        val = input_tag.value
                    }
                    if (i != (this.DATA_COUNT-1) && isNaN(val)) {
                        alert('숫자가 아닌 항목이 있습니다');
                        return;
                    }
                    else{
                        if (apply_col.checked){
                            for (let j=0; j<this.ROW_COUNT; ++j){
                                this.td_datas[j][i] = val;
                            }
                        }else{
                            this.td_datas[this.row_num][i] = val;
                        }
                    }
                }
                this.calAvgs();
                this.closeModal();
            },
            saveModalByCol: function(step) {
                console.log(this.modify_col_number)
                for (let i = 1; i <= this.ROW_COUNT; ++i) {
                    let input_tag = document.getElementById(`modal_input${i*step}`)
                    let val;
                    if (this.modify_col_number != (this.DATA_COUNT-1)){ 
                        val = parseFloat(input_tag.value);
                        if (isNaN(val)) {
                            alert('숫자가 아닌 항목이 있습니다');
                            return;
                        }
                    }else{
                        val = input_tag.value;
                    }
                    this.td_datas[i-1][this.modify_col_number] = val;
                }
                if (this.modify_col_number != (this.DATA_COUNT-1))
                    this.calAvgs();
                this.closeModalByCol();
            },
            saveModalHead: function() {
                for (let i = 0; i < this.first_datas[this.row_num].data.length; ++i) {
                    let input_tag = document.getElementById(`modal_head_input${i}`)
                    if (input_tag.value == '') {
                        alert('입력칸이 비어 있습니다.')
                        return;
                    }
                    this.first_datas[this.row_num].data[i] = input_tag.value;
                }

                this.closeModalHead();
            },
            calAvgs: function() {
                let sums = Array(this.DATA_COUNT-1).fill(0);
                for (let i = 0; i < this.ROW_COUNT; ++i) {
                    let row = this.td_datas[i];
                    for (let j = 0; j < this.DATA_COUNT-1; ++j) {
                        sums[j] += row[j];
                    }
                }
                for (let i = 0; i < this.DATA_COUNT-1; ++i) {
                    this.avgs[i] = sums[i] / this.ROW_COUNT;
                }


            },
            clearAll: function() {
                this.td_datas = []
                this.avgs = []
                this.check_boxs = []
                for (let i = 0; i < this.ROW_COUNT; ++i) {
                    this.td_datas.push(Array(this.DATA_COUNT-1).fill(EMPTY_DATA))
                    this.td_datas[i].push('')
                }

                for (let i = 0; i < this.DATA_COUNT-1; ++i) {
                    this.avgs.push(0);
                }

                for (let i = 0; i < this.first_datas.length; ++i) {
                    for (let j = 0; j < this.first_datas[i].data.length; ++j) {
                        this.first_datas[i].data[j] = ''
                    }
                }

            },
            toggleShow: function() {
                this.page_show = !this.page_show;
            },

            init: function() {
                this.td_datas = []
                this.avgs = []
                this.headers = []
                this.check_boxs = []
                for (let i = 0; i < this.ROW_COUNT; ++i) {
                    this.td_datas.push(Array(this.DATA_COUNT-1).fill(EMPTY_DATA))
                    this.td_datas[i].push('')
                }

                for (let i = 0; i < this.DATA_COUNT-1; ++i) {
                    this.avgs.push(0);
                }
                for (let i = 0; i < this.first_datas.length; ++i) {
                    for (let j = 0; j < this.first_datas[i].data.length; ++j) {
                        this.first_datas[i].data[j] = ''
                    }
                }
                for (let head of this.header_keys) {
                    if (head.col != 1) {
                        for (let i = 0; i < head.col; ++i) {
                            this.headers.push(`${head.head}${i+1}`)
                            this.check_boxs.push(head.checks)
                        }
                    } else {
                        this.headers.push(`${head.head}`)
                        this.check_boxs.push(head.checks)
                    }
                    
                }
            },
            clickedModify: function(event) {
                this.prev_row = this.ROW_COUNT
                this.closeModalLeft()
                this.b_modify = true;
                this.b_modify_block = false;
            },
            addColBtnClicked: function(event) {
                this.b_modal_show_add_col_btn = true;
            },
            closeModalAddColBtn: function(){
                this.b_modal_show_add_col_btn = false;
            },
            addRowBtnClicked: function(event) {
                if (this.b_modify_block) {
                    return
                }
                this.ROW_COUNT += 1
                this.clearAll()
            },
            removeRowBtnClicked: function(event) {
                if (this.b_modify_block) {
                    return
                }
                if (this.ROW_COUNT <= 1) {
                    return
                }
                this.ROW_COUNT -= 1
                this.clearAll()
            },
            saveFormBtnClicked: function(event) {
                if (this.b_modify_block) {
                    return
                }
                this.b_modify_block = true
                db.changeNoteFormRow(this.ROW_COUNT)
                this.b_page_show = false;
                this.toggleShow()
                this.init()
                this.b_page_show = true;


                this.b_modify_block = false;
                this.b_modify = false;
            },
            cancelBtnClicked: function(event) {
                if (this.b_modify_block) {
                    return
                }
                this.ROW_COUNT = this.prev_row;

                this.clearAll()
                this.toggleShow()
                this.b_modify = false;
            },
            showModalCSV: function() {
                this.b_modal_show_csv = true
                this.showModalLoad()
            },
            loadNoteForm: function(note_form) {
                console.log(note_form)
                db.current_form = note_form.title
                db.note_form = note_form
                this.header_keys = db.note_form.keys.filter(function(el) { return el != null; })

                this.ROW_COUNT = note_form.row
                this.DATA_COUNT = note_form.col + 1
                this.init()
                db.setCurrentForm(db.current_form)

                this.closeModalLoad()
                this.toggleShow()
            },
            downloadCSV: function(note_form) {
                this.showDownloadBtn()
                this.download_note_form = note_form
                    //db.downloadCSV(note_form)
            },
            downloadToCSV: function() {
                console.log('me')
                db.downloadCSV(this.download_note_form)
            }

        }
    });



    //getRedirectResult 콜백 생성 :  로그인 페이지 결과 받는 콜백
    firebase.auth().getRedirectResult().then(function(result) {
        if (result.credential) {
            // This gives you a Google Access Token. You can use it to access the Google API.
            var token = result.credential.accessToken;
            console.log('로그인 성공')
                // ...
        }
        // The signed-in user info.
        var user = result.user;
    }).catch(function(error) {
        // Handle Errors here.
        var errorCode = error.code;
        var errorMessage = error.message;
        // The email of the user's account used.
        var email = error.email;
        // The firebase.auth.AuthCredential type that was used.
        var credential = error.credential;
        // ...
    });


}


// 메뉴판 보기
function showModalLeft() {
    app_vue.showModalLeft();
}

//양식 수정하기에서 항목 추가
function addMenu() {
    let form = document.getElementById('create_form_div1');
    let form2 = document.getElementById('create_form_div2');
    let template_div = document.createElement('div')
    template_div.style = 'margin:10px 0px 30px 0px'
    template_div.innerHTML = `<input class='modal_cols menu_input menu1' placeholder='ex)Length'>
    <p style='margin:0'><input type='checkbox' class='modal_apply_check_box' v-model='checked'><span style='color:#ff0000'>행단위로 보기</span></p>
    `
    let template_div2 = document.createElement('div')
    template_div2.style = 'margin:10px 0px 30px 0px'
    template_div2.innerHTML = `<input class='modal_cols menu_input menu2' placeholder='ex)3'>
    <p style='margin:0;color:transparent'>z</p>
    `
    form.appendChild(template_div)
    form2.appendChild(template_div2)
}

//양식 수정하기에서 항목 제거
function removeMenu() {
    let form = document.getElementById('create_form_div1');
    let form2 = document.getElementById('create_form_div2');

    let child = form.lastChild
    if (child.tagName != 'DIV') {
        return
    }
    child.remove()
    let child2 = form2.lastChild
    if (child2.tagName != 'DIV') {
        return
    }
    child2.remove()
}


// 양식 수정하기 - 열 추가하기 - 저장함수 Wrapper
async function saveNoteFormCol() {
    let btn = document.getElementById('edit_note_form_btn')
    if (btn.disabled == true) {
        return;
    }
    btn.disabled = true
    await _saveNoteFormCol()
    btn.disabled = false;

}

// 양식 수정하기 - 열 추가하기 - 저장 
async function _saveNoteFormCol() {
    let menus1 = document.getElementsByClassName('menu1')
    let menus2 = document.getElementsByClassName('menu2')
    let check_boxs = document.getElementsByClassName('modal_apply_check_box')

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
    // key is keys
    app_vue.b_modal_show_add_col_btn = false;
    app_vue.DATA_COUNT += cols
    result['keys'] = [...app_vue.header_keys, ...datas]
    result['col'] = app_vue.DATA_COUNT - 1 
    console.log(result)
    db.updateData(`note_form/list/${db.current_form}`, result)
    await db.readNoteCurrents();

    app_vue.ROW_COUNT = db.note_form.row
    app_vue.DATA_COUNT = db.note_form.col + 1
    app_vue.b_modify = false;
    app_vue.b_prev_data_show = false;
    app_vue.header_keys = db.note_form.keys.filter(function(el) { return el != null; })
    app_vue.init()
    console.log(app_vue.headers)

    
}

window.saveNoteFormCol = saveNoteFormCol;
window.showModalLeft = showModalLeft;
window.addMenu = addMenu;
window.removeMenu = removeMenu;