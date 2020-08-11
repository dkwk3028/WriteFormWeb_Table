import { app_vue } from './init.js'
import { login } from './login.js'

const PAGE_NUMBER = 10
const LAST_KEY = '_not_afb_adlfkj_LAST_KEY_dfajfjaalk'

function preventHandler(e) {
    e.stopPropagation();
    e.preventDefault();
}
class Database {
    constructor() {
        document.addEventListener("click", preventHandler, true);
        this.database = firebase.database();
        this.current_form = 'Default'
        this.current_form_key = '??'
        this.note_form = {}
        this.temp_notes = []
        this.page_key = ''
            //this.removeNode('note')
            //this.readCurrentForm();
        this.init()
    }
    async init() {
        await this.readNoteCurrents();
        await this.getNoteData(this.current_form)
        app_vue.header_keys = this.note_form.keys.filter(function(el) { return el != null; })
            //console.log(this.note_form)
            //console.log(app_vue.ROW_COUNT)

        app_vue.ROW_COUNT = this.note_form.row;
        app_vue.DATA_COUNT = this.note_form.col + 1;
        //console.log(app_vue.ROW_COUNT)
        app_vue.b_page_show = true;
        app_vue.init();
        let el = document.getElementById('note_form_title')
        el.innerText = this.current_form
        login();
        document.removeEventListener('click', preventHandler, true)
            //console.log('me')
    }
    pushData(root, data) {
        this.database.ref(root).push(data, function(error) {
            if (error) {
                alert('쓰기과정에서 문제가 발생해서 저장이 되지않았습니다')
            }
        })
    }

    setData(root, data) {
        this.database.ref(root).set(data, function(error) {
            if (error) {
                alert('쓰기과정에서 문제가 발생해서 저장이 되지않았습니다')
            }
        })
    }

    async readNoteForms() {
        const snapshot = await this.database.ref('note_form/list').once('value')
        this.temp_notes = []
        snapshot.forEach((child) => {
            this.temp_notes.push(child.val())
        })
        console.log(this.temp_notes)
        app_vue.note_form_loads = this.temp_notes
    }
    async readNoteCurrents() {
        await this.readCurrentForm()
        await this.readNoteFormsByTitle(this.current_form)
    }
    async readNoteFormsByTitle(title) {

        const snapshot = await this.database.ref('note_form/list').orderByChild('lower').equalTo(title.toLowerCase()).once("value")
        snapshot.forEach((child) => {
            this.note_form = child.val()
            this.current_form_key = child.key
        })
        if (Object.keys(this.note_form).length == 0) {
            let snapshot2 = await this.database.ref('note_form/list').orderByChild('lower').equalTo('default').once("value")
            snapshot2.forEach((child) => {
                this.note_form = child.val()
            })
            if (Object.keys(this.note_form).length == 0) {
                this.pushDefaultNoteForm()
                await this.readNoteFormsByTitle('Default')
            }
        }
    }
    async readCurrentForm() {
        const snapshot = await this.database.ref('note_form/current_form').once('value')
        if (snapshot.val() == null) {
            this.setCurrentForm('Default')
            this.readCurrentForm()
            return
        }
        this.current_form = snapshot.val().title;
        console.log(this.current_form)
    }

    setCurrentForm(title = 'Default') {
        this.setData('note_form/current_form', { 'title': title })
        let el = document.getElementById('note_form_title')
        el.innerText = title
        console.log('setCurrentForm')
    }

    async pushNoteForm(result) {
        let row = result.row
        let col = result.col
        let datas = result.data
        let title = result.title

        let push_data = {
            'row': row,
            'col': col,
            'keys': datas,
            'title': title,
            'lower': title.toLowerCase()
        }
        console.log(push_data)
        app_vue.b_page_show = false;
        this.setData('note_form/list/' + title, push_data);
        this.setCurrentForm(title)

        await this.readNoteCurrents();
        app_vue.ROW_COUNT = row
        app_vue.DATA_COUNT = col + 1

        app_vue.header_keys = this.note_form.keys.filter(function(el) { return el != null; })
        app_vue.init()
        console.log(app_vue.headers)
        app_vue.b_page_show = true;
    }
    pushDefaultNoteForm() {
        this.setData('note_form/list/' + 'Default', {
            'row': 16,
            'col': 6,
            'keys': [
                { 'head': 'Length', 'col': 1,'checks':false },
                { 'head': 'Count_No.', 'col': 1,'checks':false },
                { 'head': 'SPAD', 'col': 3, 'checks':true },
                { 'head': 'Panicle No.', 'col': 1,'checks':false },
            ],
            'title': 'Default',
            'lower': 'default'
        })
    }
    removeNode(node) {
        this.database.ref(node).remove()
    }

    async checkNoteDuplicated(title) {
        const snapshot = await this.database.ref('note_form/list').orderByChild('lower').equalTo(title.toLowerCase()).once('value')
        if (snapshot.val() == null) {
            return false;
        } else {
            return true;
        }
    }

    changeNoteFormRow(row) {
        this.database.ref('note_form/list/' + this.current_form).update({ 'row': row }, function(error) {
            if (error) {
                alert('업데이트 실패')
            }
        })
    }

    async readNoteLists() {
        console.log('readNotes')
        if (this.page_key == LAST_KEY) {
            console.log('is end')
            app_vue.b_possible_load_more = true
            return
        }
        let snapshot;

        if (this.page_key == '') {
            snapshot = await this.database.ref('notes/' + this.current_form + '/' + firebase.auth().currentUser.uid).orderByKey().limitToLast(PAGE_NUMBER + 1).once('value')
        } else {
            snapshot = await this.database.ref('notes/' + this.current_form + '/' + firebase.auth().currentUser.uid).orderByKey().limitToLast(PAGE_NUMBER + 1).endAt(this.page_key).once('value')
        }
        let i = 0;
        let datas = []
        if (snapshot.val() == null) {
            app_vue.b_possible_load_more = true
            return
        }
        let snap_keys = Object.keys(snapshot.val())
        for (let idx = 0; idx < snap_keys.length; ++idx) {
            let push_key = snap_keys[snap_keys.length - idx - 1]
            if (i == PAGE_NUMBER) {
                this.page_key = push_key
                i += 1
                break
            }

            let child = snapshot.val()[push_key]
            child['push_key'] = push_key
            datas.push(child)
            console.log(child)
            i += 1
        }
        app_vue.prev_datas.push(...datas)
        console.log(app_vue.prev_datas)
        if (i <= PAGE_NUMBER) {
            this.page_key = LAST_KEY
        }

        app_vue.b_possible_load_more = true
    }
    async downloadCSV(note_form) {
        let toCSV = new ToCSV()
        const note_snapshot = await this.getNoteData(note_form.title)
        toCSV.downloadCSV(note_snapshot.val(), note_form, `${note_form.title}.csv`)
    }
    async getNoteData(title) {
        let note_data = await this.database.ref('notes/' + title).once('value')
        return note_data
    }

    clearDB() {
        this.removeNode('notes/')
        this.removeNode('note_form/')
    }

}


class ToCSV {
    changeDataToCSV(data, note_form) {
        let columns = ['Date', 'Location', 'Writer']
        for (let key_data of note_form.keys) {
            if (key_data.col == 1) {
                columns.push(key_data.head)
            } else {
                for (let i = 0; i < key_data.col; ++i) {
                    columns.push(`${key_data.head}${i+1}`)
                }
            }
        }
        columns.push('Note.')
        columns.push('UID')
        let keys = Object.keys(data)

        let csv_data = []
        let avg_data = ['Avg','','',...Array(app_vue.DATA_COUNT-1).fill(0),'','']
        console.log(avg_data)
        csv_data.push(columns.join(', '))

        let total = 0
        for (let i = 0; i < keys.length; ++i) {
            let user_key = keys[i]

            let user_data = data[user_key]
            let push_keys = Object.keys(user_data)

            for (let j = 0; j < push_keys.length; ++j) {
                let push_key = push_keys[push_keys.length - 1 - j]
                let push_data = user_data[push_key]
                total += push_data.datas.length
                for (let sub_push_data of push_data.datas) {
                    
                    let row = [push_data.time, push_data.Location, push_data.Writer]
                    csv_data.push([...row, ...sub_push_data, push_data.uid].join(', '))
                    for (let k=0; k<sub_push_data.length-1; ++k){
                        avg_data[k+3] += sub_push_data[k]
                        
                    }
                }
            }

        }

        
        total = total==0 ? 1 : total
        console.log(`total is ${total}`)
        for (let i=0; i<app_vue.DATA_COUNT-1; ++i){
            console.log(`${i}번째 avg_data : ${avg_data[i+3]}`)
            avg_data[i+3] /= total
        }
        csv_data.push(Array(app_vue.DATA_COUNT + 4).fill('').join(', '))
        csv_data.push(avg_data.join(', '))
        return csv_data.join('\n')
    }
    downloadCSV(data, note_form, filename) {
        if (data == null) {
            alert('아직 작성된 기록이 없습니다!')
            return
        }

        let csv_File;
        let download_link;

        let csv = this.changeDataToCSV(data, note_form)
        try {
            csv_File = new Blob(["\ufeff" + csv], { type: "data:text/csv;charset=utf-8" })
        } catch (e) {
                // TypeError old chrome and FF
            window.BlobBuilder = window.BlobBuilder ||
                window.WebKitBlobBuilder ||
                window.MozBlobBuilder ||
                window.MSBlobBuilder;
            if (e.name == 'TypeError' && window.BlobBuilder) {
                var bb = new BlobBuilder();
                bb.append("\ufeff")
                bb.append(csv);
                csv_File = bb.getBlob("data:text/csv;charset=utf-8");
            } else if (e.name == "InvalidStateError") {
                // InvalidStateError (tested on FF13 WinXP)
                csv_File = new Blob(["\ufeff" + csv], { type: "data:text/csv;charset=utf-8" })
            } else {
                // We're screwed, blob constructor unsupported entirely   
            }
        }
        
        let btn_tag = document.createElement('button')
        download_link = document.createElement('a')
        download_link.target = '_blank'
        download_link.download = filename;
        download_link.style = 'display:block; text-decoration:none'
        console.log(csv_File)
        download_link.href = window.URL.createObjectURL(csv_File)
        
        console.log(download_link.href)
        download_link.innerText = 'Download'
        btn_tag.appendChild(download_link)

        let save_box = document.getElementById('save_box_download')
        save_box.appendChild(btn_tag)
            //document.location = download_link.href
    }
}
export var db = new Database();