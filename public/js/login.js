export function login() {
    
    var user = firebase.auth().currentUser;

    if (user == null){
        var provider = new firebase.auth.GoogleAuthProvider();
        firebase.auth().signInWithRedirect(provider);
    }else{
        console.log('이미 로그인 되어있습니다')
    }
    
}
