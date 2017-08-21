var data = {
    name: "Someone",
    title: "Untitled",
    authCode: null,
    _subject: "New ProofAdoc!",
    _format: "plain"
};

forge.options.usePureJavaScript = true;
//var keypair = forge.pki.rsa.generateKeyPair({bits: 2048, e: 0x10001});

function hashDoc() {
    var form = document.getElementById('form')
    let name = form[0].value;
    let title = form[1].value;
    let data = form[2].value;

    var md = forge.md.sha256.create();
    md.update(name+"||"+title+"||"+data,'utf8');
    document.getElementById("hash").innerHTML = md.digest().toHex();

    updateObj({hash: md.digest().toHex()});

    return md;
}

function signDoc() {
    var form = document.getElementById('form')

    try {
        var privateKey = forge.pki.privateKeyFromPem("-----BEGIN RSA PRIVATE KEY-----" + form[3].value + "-----END RSA PRIVATE KEY-----");
    } catch (err) {
        alert("Private Key is invalid.");
        console.error(err);
        return;
    }

    var md = hashDoc();
    var authCode = forge.util.encode64(privateKey.sign(md));
    console.log("AuthCode: " + authCode);
    document.getElementById("authCode").value = authCode;

    var timestamp = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');

    updateObj({
        timestamp: timestamp,
        authCode: authCode
    });
}

function checkDoc() {
    var form = document.getElementById('form')
    let name = form[0].value;
    let title = form[1].value;
    let data = form[2].value;
    let authCode = form[4].value;

    try {
        var publicKey = forge.pki.publicKeyFromPem("-----BEGIN PUBLIC KEY-----" + form[5].value + "-----END PUBLIC KEY-----");
    } catch (err) {
        alert("Public Key is invalid.");
        console.error(err);
        return;
    }

    var md = hashDoc();

    try {
        var result = publicKey.verify(md.digest().getBytes(), forge.util.decode64(authCode));
        alert("The doc is " + result + "!");
    } catch (err) {
        alert("Can't proof this doc.");
        console.error(err);
        return;
    }

    var timestamp = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');

    updateObj({
        hash: md.digest().toHex(),
        timestamp: timestamp,
        authCode: authCode
    });
}

function updateObj(object){
    var form = document.getElementById('form')
    let name = form[0].value;
    let title = form[1].value;

    data['name'] = name ? name : data['name'];
    data['title'] = title ? title : data['title'];

    for(var key in object){
        data[key] = object[key];
    }
}

function mailDoc() {
    var form = document.createElement('form');
    let path = "https://formspree.io/h.orefice@gmail.com";

    form._submit_function_ = form.submit;

    form.setAttribute('method', 'POST');
    form.setAttribute('action', path);
    //form.setAttribute('target', '_blank');

    for(var key in data) {
        var hiddenField = document.createElement('input');
        hiddenField.setAttribute('type', 'hidden');
        hiddenField.setAttribute('name', key);
        hiddenField.setAttribute('value', data[key]);

        form.appendChild(hiddenField);
    }

    document.body.appendChild(form);
    form._submit_function_();
}


function tweetDoc() {
    var base_url = "https://twitter.com/intent/tweet?hashtags=ProofAdoc&text="
    var url = base_url + encodeURI("The doc '" + data.title + "' was registered by '" + data.name + "' with the " + (data.authCode ? "AuthCode '" : "record '") + (data.authCode || data.hash || "null").substring(0,24) + "...'");
    window.open(url, "_blank", "width=500,height=300")
}