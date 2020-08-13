

// 구글 계정 로그인함수. firebase.js 에서 실행됨. 페이지를 옮기는 방식임.
export function login() {
    
    var user = firebase.auth().currentUser;

    if (user == null){
        var provider = new firebase.auth.GoogleAuthProvider();
        firebase.auth().signInWithRedirect(provider);
    }else{
        console.log('이미 로그인 되어있습니다')
    }
    
}
