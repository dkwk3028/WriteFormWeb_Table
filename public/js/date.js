export function formatDate(timestamp){
    let now_date = new Date(timestamp)
    let year = now_date.getFullYear()
    let month = now_date.getMonth()
    let day = now_date.getDay()
    
    let hour = now_date.getHours()
    let min = now_date.getMinutes()
    let sec = now_date.getSeconds()

    let firsts = [year,month,day]
    let seconds = [hour,min,sec]
    firsts = firsts.map((ele)=>{return ele < 10 ? '0' + ele : ele})
    seconds = seconds.map((ele)=>{return ele < 10 ? '0' + ele : ele})
    return firsts.join('-') + ' ' + seconds.join(':')
}
