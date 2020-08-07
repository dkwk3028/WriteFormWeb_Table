import {app_vue} from './init.js'

class Database{
    constructor(){
        this.database = firebase.database();
        this.current_form = 'default'
        this.current_form_key = '??'
        this.note_form = {}
        this.temp_notes = []
        //this.removeNode('note')
        //this.readCurrentForm();
        this.init()
    }
    async init(){
        await this.readNoteForms();
        await this.readNoteCurrents();
        app_vue.header_keys = this.note_form.keys.filter(function(el){return el!=null;})
        //console.log(this.note_form)
        //console.log(app_vue.ROW_COUNT)

        app_vue.ROW_COUNT = this.note_form.row;
        app_vue.DATA_COUNT = this.note_form.col;
        //console.log(app_vue.ROW_COUNT)
        app_vue.b_page_show = true;
        app_vue.init();
        let el = document.getElementById('note_form_title')
        el.innerText = this.current_form
        //console.log('me')
    }
    pushData(root, data){
        this.database.ref(root).push(data, function(error){
            if (error){
                alert('쓰기과정에서 문제가 발생해서 저장이 되지않았습니다')
            }
        })
    }
    
    setData(root, data){
        this.database.ref(root).set(data, function(error){
            if (error){
                alert('쓰기과정에서 문제가 발생해서 저장이 되지않았습니다')
            }
        })
    }

    async readNoteForms(){
        const snapshot = await this.database.ref('note_form/list').once('value')
        this.temp_notes = []
        snapshot.forEach((child)=>{
            this.temp_notes.push(child.val())
        })
        console.log(this.temp_notes)
        app_vue.note_form_loads = this.temp_notes
    }
    async readNoteCurrents(){
        await this.readCurrentForm()
        await this.readNoteFormsByTitle(this.current_form)
    }
    async readNoteFormsByTitle(title){
        
        const snapshot = await this.database.ref('note_form/list').orderByChild('lower').equalTo(title.toLowerCase()).once("value")
        snapshot.forEach((child)=>{
            this.note_form = child.val()
            this.current_form_key = child.key
        })
        if (Object.keys(this.note_form).length == 0){
            let snapshot2 = await this.database.ref('note_form/list').orderByChild('lower').equalTo('default').once("value")
            snapshot2.forEach((child)=>{
                this.note_form = child.val()
            })
            if (Object.keys(this.note_form).length == 0){
                this.pushDefaultNoteForm()
                await this.readNoteFormsByTitle('default')
            } 
        }
    }
    async readCurrentForm(){
        const snapshot = await this.database.ref('note_form/current_form').once('value')
        if (snapshot.val() == null){
            this.setCurrentForm('default')
            this.readCurrentForm()
            return
        }
        this.current_form = snapshot.val().title;
        console.log(this.current_form)
    }

    setCurrentForm(title='default'){
        this.setData('note_form/current_form', {'title': title})
        let el = document.getElementById('note_form_title')
        el.innerText = title
        console.log('setCurrentForm')
    }
    
    async pushNoteForm(result){
        let row = result.row
        let col = result.col
        let datas = result.data
        let title = result.title

        let push_data = {
            'row' : row,
            'col' : col,
            'keys' : datas,
            'title' : title,
            'lower' : title.toLowerCase()
        }
        console.log(push_data)
        app_vue.b_page_show = false;
        this.setData('note_form/list/' + title, push_data);
        this.setCurrentForm(title)

        await this.readNoteCurrents();
        app_vue.ROW_COUNT = row
        app_vue.DATA_COUNT = col
        
        app_vue.header_keys = this.note_form.keys.filter(function(el){return el!=null;})
        app_vue.init()
        console.log(app_vue.headers)
        app_vue.b_page_show = true;
    }
    pushDefaultNoteForm(){
        this.setData('note_form/list/' + this.current_form, {
            'row' : 16,
            'col' : 7,
            'keys' : [
                {'head' : 'Length',  'col':1},
                {'head' : 'Count_No.', 'col':1},
                {'head' : 'SPAD', 'col' : 3},
                {'head' : 'Panicle No.','col' : 1},
                {'head' : 'Note', 'col' : 1}
            ],
            'title' : 'Default',
            'lower' : 'default'
        })
    }
    removeNode(node){
        this.database.ref(node).remove()
    }

    async checkNoteDuplicated(title){
        const snapshot = await this.database.ref('note_form/list').orderByChild('lower').equalTo(title.toLowerCase()).once('value')
        if (snapshot.val() == null){
            return false;
        }else{
            return true;
        }
    }

    changeNoteFormRow(row){
        this.database.ref('note_form/list/' + this.current_form).update({'row' : row}, function(error){
            if (error){
                alert('업데이트 실패')
            }
        })
    }
}

export var db = new Database();
