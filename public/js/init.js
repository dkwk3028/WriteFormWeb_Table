import { db } from "./firebase.js";

export var app_vue;
window.onload = function () {
    app_vue = new Vue({
        el: '#app',
        data: {
            DATA_COUNT : 6,
            ROW_COUNT : 16,
            prev_row : 16,
            page_show : false,
            b_page_show : false,
            b_modal_show: false,
            b_modal_show_head: false,
            b_modal_show_left : false,
            b_modal_show_modify : false,
            b_modal_avg : false,
            b_modify : false,
            b_modify_block : false,
            b_modal_show_load : false,
            td_datas: [],
            note_form_loads: [],
            header_keys: [
                {'head' : 'Length',  'col':1},
                {'head' : 'Count_No.', 'col':1},
                {'head' : 'SPAD', 'col' : 3},
                {'head' : 'Panicle No.','col' : 1},
                {'head' : 'Note', 'col' : 1}
            ],
            colspans:[

            ],
            headers: [
            ],
            first_datas: [
                { 'head': 'Location', 'heads': ['위치'], 'data': [''] },
                { 'head': 'Writer', 'heads': ['Writer'], 'data': [''] }
            ],
            avgs: [],
            row_num: 0
        },
        methods: {
            showModal: function (event) {
                
                if (this.b_modify){
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
                if (isNaN(tds[0].innerText)){
                    this.b_modal_avg = true;
                }else{
                    let row_num = parseInt(tds[0].innerText)-1;
                    this.row_num = row_num;
                }
                this.b_modal_show = true;
                

            },
            showModalLeft: function(event){
                if (this.b_modify){
                    return
                }
                this.b_modal_show_left = true;
            },
            showModalLoad: function(event){
                this.closeModalLeft()
                
                this.b_modal_show_load = true
                this.note_form_loads = []
                db.readNoteForms()
            },
            showModalHead: function (event) {
                if (this.b_modify){
                    return
                }
                let td = event.target;
                if (td.id == 'location'){
                    this.row_num = 0;
                }else if(td.id == 'writer'){
                    this.row_num = 1;
                }
                this.b_modal_show_head = true;
            },
            showModalModify: function (event){
                this.b_modal_show_left = false;
                this.b_modal_show_modify = true;
            },
            closeModalLoad: function(){
                this.b_modal_show_load = false;
            },
            closeModalModify: function (){
                this.b_modal_show_modify = false;
            },
            closeModal: function () {
                this.b_modal_show = false;
            },
            closeModalHead: function () {
                this.b_modal_show_head = false;
            },
            closeModalLeft: function(){
                this.b_modal_show_left = false;
            },
            saveModal: function () {
                for (let i = 0; i < this.DATA_COUNT; ++i) {
                    let input_tag = document.getElementById(`modal_input${i}`)
                    let val = parseFloat(input_tag.value);
                    if (isNaN(val)) {
                        alert('숫자가 아닌 항목이 있습니다');
                        return;
                    }

                    this.td_datas[this.row_num][i] = val;
                }
                this.calAvgs();
                this.closeModal();
            },
            saveModalHead: function () {
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
            calAvgs: function () {
                let sums = Array(this.DATA_COUNT).fill(0);
                for (let i = 0; i < this.ROW_COUNT; ++i) {
                    let row = this.td_datas[i];
                    for (let j = 0; j < this.DATA_COUNT; ++j) {
                        sums[j] += row[j];
                    }
                }
                for (let i = 0; i < this.DATA_COUNT; ++i) {
                    this.avgs[i] = sums[i] / this.ROW_COUNT;
                }


            },
            clearAll: function(){
                this.td_datas = []
                this.avgs = []
                for (let i = 0; i < this.ROW_COUNT; ++i) {
                    this.td_datas.push(Array(this.DATA_COUNT).fill(''))
                }
            
                for (let i = 0; i < this.DATA_COUNT; ++i) {
                    this.avgs.push(0);
                }
            
                for (let i=0; i<this.first_datas.length; ++i){
                    for (let j=0; j<this.first_datas[i].data.length; ++j){
                        this.first_datas[i].data[j] = ''
                    }
                }
            },
            toggleShow: function(){
                this.page_show = !this.page_show;
            },

            init: function(){
                this.td_datas = []
                this.avgs = []
                this.headers = []
                for (let i = 0; i < this.ROW_COUNT; ++i) {
                    this.td_datas.push(Array(this.DATA_COUNT).fill(''))
                }
            
                for (let i = 0; i < this.DATA_COUNT; ++i) {
                    this.avgs.push(0);
                }
                for (let i=0; i<this.first_datas.length; ++i){
                    for (let j=0; j<this.first_datas[i].data.length; ++j){
                        this.first_datas[i].data[j] = ''
                    }
                }
                for (let head of this.header_keys){
                    if (head.col != 1){
                        for (let i=0; i<head.col;++i){
                            this.headers.push(`${head.head}${i+1}`)
                        }
                    }else{
                        this.headers.push(`${head.head}`)
                    }
                }
            },
            clickedModify: function(event){
                this.prev_row = this.ROW_COUNT
                this.closeModalLeft()
                this.b_modify = true;
                this.b_modify_block = false;
            },
            addRowBtnClicked: function(event){
                if (this.b_modify_block){
                    return
                }
                this.ROW_COUNT += 1
                this.clearAll()
            },
            removeRowBtnClicked: function(event){
                if (this.b_modify_block){
                    return
                }
                if (this.ROW_COUNT <= 1){
                    return
                }
                this.ROW_COUNT -= 1
                this.clearAll()
            },
            saveFormBtnClicked: function(event){
                if (this.b_modify_block){
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
            cancelBtnClicked: function(event){
                if (this.b_modify_block){
                    return
                }
                this.ROW_COUNT = this.prev_row;
                
                this.clearAll()
                this.toggleShow()
                this.b_modify = false;
            },
            loadNoteForm: function(note_form){
                db.current_form = note_form.title
                db.note_form = note_form
                this.header_keys = db.note_form.keys.filter(function(el){return el!=null;})
            
                this.ROW_COUNT = note_form.row
                this.DATA_COUNT = note_form.col
                this.init()
                db.setCurrentForm(db.current_form)
                
                this.closeModalLoad()
                this.toggleShow()
            }

        }
    });

    
    //init td_datas


    firebase.auth().getRedirectResult().then(function (result) {
        if (result.credential) {
            // This gives you a Google Access Token. You can use it to access the Google API.
            var token = result.credential.accessToken;
            console.log('로그인 성공')
            // ...
        }
        // The signed-in user info.
        var user = result.user;
    }).catch(function (error) {
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


function showModalLeft(){
    app_vue.showModalLeft();
}

function addMenu(){
    let form = document.getElementById('create_form_div1');
    let form2 = document.getElementById('create_form_div2');
    let template_div = document.createElement('div')
    template_div.style = 'margin:10px 0px 30px 0px'
    template_div.innerHTML = `<input class='modal_cols menu_input menu1' placeholder='ex)Length'>`
    let template_div2 = document.createElement('div')
    template_div2.style = 'margin:10px 0px 30px 0px'
    template_div2.innerHTML = `<input class='modal_cols menu_input menu2' placeholder='ex)3'>`
    form.appendChild(template_div)
    form2.appendChild(template_div2)
}

function removeMenu(){
    let form = document.getElementById('create_form_div1');
    let form2 = document.getElementById('create_form_div2');

    let child = form.lastChild
    if (child.tagName != 'DIV'){
        return
    }
    child.remove()
    let child2 = form2.lastChild
    if (child2.tagName != 'DIV'){
        return
    }
    child2.remove()
}


window.showModalLeft = showModalLeft;
window.addMenu = addMenu;
window.removeMenu = removeMenu;