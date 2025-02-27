const APPLE_CERT_OLD = ["7B227073704964223A2246354246304143324336314131413238313043373531453439333444414433384346393037313041303935303844314133453241383436314141363232414145222C2276657273696F6E223A312C22637265617465644F6E223A313633343737323736393531342C227369676E6174757265223A223330383030363039326138363438383666373064303130373032613038303330383030323031303133313066333030643036303936303836343830313635303330343032303130353030333038303036303932613836343838366637306430313037303130303030613038303330383230336533333038323033383861303033303230313032303230383463333034313439353139643534333633303061303630383261383634386365336430343033303233303761333132653330326330363033353530343033306332353431373037303663363532303431373037303663363936333631373436393666366532303439366537343635363737323631373436393666366532303433343132303264323034373333333132363330323430363033353530343062306331643431373037303663363532303433363537323734363936363639363336313734363936663665323034313735373436383666373236393734373933313133333031313036303335353034306130633061343137303730366336353230343936653633326533313062333030393036303335353034303631333032353535333330316531373064333133393330333533313338333033313333333233353337356131373064333233343330333533313336333033313333333233353337356133303566333132353330323330363033353530343033306331633635363336333264373336643730326436323732366636623635373232643733363936373665356635353433333432643530353234663434333131343330313230363033353530343062306330623639346635333230353337393733373436353664373333313133333031313036303335353034306130633061343137303730366336353230343936653633326533313062333030393036303335353034303631333032353535333330353933303133303630373261383634386365336430323031303630383261383634386365336430333031303730333432303030346332313537376564656264366337623232313866363864643730393061313231386463376230626436663263323833643834363039356439346166346135343131623833343230656438313166333430376538333333316631633534633366376562333232306436626164356434656666343932383938393365376330663133613338323032313133303832303230643330306330363033353531643133303130316666303430323330303033303166303630333535316432333034313833303136383031343233663234396334346639336534656632376536633466363238366333666132626664326534623330343530363038326230363031303530353037303130313034333933303337333033353036303832623036303130353035303733303031383632393638373437343730336132663266366636333733373032653631373037303663363532653633366636643266366636333733373033303334326436313730373036633635363136393633363133333330333233303832303131643036303335353164323030343832303131343330383230313130333038323031306330363039326138363438383666373633363430353031333038316665333038316333303630383262303630313035303530373032303233303831623630633831623335323635366336393631366536333635323036663665323037343638363937333230363336353732373436393636363936333631373436353230363237393230363136653739323037303631373237343739323036313733373337353664363537333230363136333633363537303734363136653633363532303666363632303734363836353230373436383635366532303631373037303663363936333631363236633635323037333734363136653634363137323634323037343635373236643733323036313665363432303633366636653634363937343639366636653733323036663636323037353733363532633230363336353732373436393636363936333631373436353230373036663663363936333739323036313665363432303633363537323734363936363639363336313734363936663665323037303732363136333734363936333635323037333734363137343635366436353665373437333265333033363036303832623036303130353035303730323031313632613638373437343730336132663266373737373737326536313730373036633635326536333666366432663633363537323734363936363639363336313734363536313735373436383666373236393734373932663330333430363033353531643166303432643330326233303239613032376130323538363233363837343734373033613266326636333732366332653631373037303663363532653633366636643266363137303730366336353631363936333631333332653633373236633330316430363033353531643065303431363034313439343537646236666435373438313836383938393736326637653537383530376537396235383234333030653036303335353164306630313031666630343034303330323037383033303066303630393261383634383836663736333634303631643034303230353030333030613036303832613836343863653364303430333032303334393030333034363032323130306265303935373166653731653165373335623535653561666163623463373266656234343566333031383532323263373235313030326236316562643666353530323231303064313862333530613564643664643665623137343630333562313165623263653837636661336536616636636264383338303839306463383263646461613633333038323032656533303832303237356130303330323031303230323038343936643266626633613938646139373330306130363038326138363438636533643034303330323034343733303435303232303665356233363937366364383733653632623339326330353136633134326362356639303938663330323535656435343938633436393039356133636462346430323231303038396261626335356162626635653037393163633139373562306535383630633937336532336661313266643338343533303930353938343061326363363337303030303030303030303030227D"];
const APPLE_CERT = "7B227073704964223A2246354246304143324336314131413238313043373531453439333444414433384346393037313041303935303844314133453241383436314141363232414145222C2276657273696F6E223A312C22637265617465644F6E223A313731353230343037313232362C227369676E6174757265223A22333038303036303932613836343838366637306430313037303261303830333038303032303130313331306433303062303630393630383634383031363530333034303230316130383139333330313830363039326138363438383666373064303130393033333130623036303932613836343838366637306430313037303133303163303630393261383634383836663730643031303930353331306631373064333233313331333033323330333233333333333233343339356133303238303630393261383634383836663730643031303933343331316233303139333030623036303936303836343830313635303330343032303161313061303630383261383634386365336430343033303233303266303630393261383634383836663730643031303930343331323230343230353936643939343335373738303366313137346361653066633761343164383634653964366266336535363638646164356563393334303937313439633762623330306130363038326138363438636533643034303330323034343733303435303232313030383565623363643837343731346466343461333830373838643439626537656630303630643765313236633966653638663261333336386363623233373363643032323035366535336363363330376433393561643465663532376234333531323462616636653761383537363030616463376135343561333862613039376139643734303030303030303030303030227D";
const WIKI_SEARCH = "https://wiki.corp.adobe.com/dosearchsite.action?cql=siteSearch+~+%22#PLACEHOLDER#%22+and+space+in+(%22CTAGRP%22%2C%22CENG%22)+and+type+%3D+%22page%22&queryString=#PLACEHOLDER#";
document.addEventListener('click', function(event) {
    const target = event.target;
    if (target.tagName === 'BUTTON' || target.tagName === 'A') {
        const formData = new FormData();
        formData.append('event', target.id);
        fetch('https://master-7rqtwti-ppm5n3o2bd4e4.us-4.magentosite.cloud/analytics.php', {
            method: 'POST',
            body: formData
        }).then((res) => {
            console.log(res);
        });
    }
});

document.querySelectorAll('.content a').forEach(function(element) {
    element.addEventListener('click', function(event) {
        event.preventDefault();
    });
});

document.addEventListener('DOMContentLoaded', function () {
    var tabConfig = {};
    chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
        tabConfig.activeTab = tabs[0];
        tabConfig.activeTabUrl = tabs[0].url;
        tabConfig.url = new URL(tabs[0].url);
        tabConfig.domain = new URL(tabs[0].url).hostname;
    });

    var applePay = document.getElementById('validateApplePayCert');
    var checkPayPalSDK = document.getElementById('getPayPalSDK');
    var checkEnabledPaymentMethods = document.getElementById('checkEnabledPaymentMethods');
    var getPaymentMethods = document.getElementById('getPaymentMethods');
    var searchInput = document.getElementById('searchQuery');
    var webReqs = document.getElementById('webReqs');
    var isFastly = document.getElementById('isFastly');
    var isHyva = document.getElementById('isHyva');
    var getMixins = document.getElementById('getMixins');
    var fastCheckout = document.getElementById('fastCheckout');
    var screenshot = document.getElementById('screenshot');
    var collectErrors = document.getElementById('collectErrors');
    var analyzeWithPerplexity = document.getElementById('analyzeWithPerplexity');

    // Always set Perplexity integration to enabled
    chrome.storage.local.set({ 'sendToPerplexity': true });

    applePay.addEventListener('click', function () {
        let newUrl = tabConfig.url.protocol + "//" + tabConfig.domain + "/.well-known/apple-developer-merchantid-domain-association";
        fetch(newUrl, {
            method: 'GET',
            // Ignore certificate errors
            mode: 'no-cors'
        })
            .then(response => response.text())
            .then(data => {
                if (data === APPLE_CERT) {
                    alert("Apple Certificate is VALID");
                } else if (APPLE_CERT_OLD.includes(data)) {
                    alert("Old payment services certificate detected! Please update Payment Services module");
                }
                else {
                    alert("Apple Certificate is NOT VALID:\n Console command to share with client copied to the clipboard\n" + data);
                    navigator.clipboard.writeText("Please analyse if Apple Pay Domain Verification certificate is accessible. Next CLI command can help with investigation: \ncurl -IL " + tabConfig.url.protocol + "//" + tabConfig.domain + "/.well-known/apple-developer-merchantid-domain-association");
                }
            })
            .catch(error => {
                console.error('Error fetching:', error);
                alert("Error fetching from " + newUrl);
            });
    });

    checkEnabledPaymentMethods.addEventListener('click', function () {
        chrome.tabs.sendMessage(tabConfig.activeTab.id, {"message": "checkEnabledPaymentMethods"});
    });

    fastCheckout.addEventListener('click', function () {
        chrome.tabs.sendMessage(tabConfig.activeTab.id, {"message": "fastCheckout", "tabConfig": tabConfig});
    });

    isHyva.addEventListener('click', function () {
        chrome.tabs.sendMessage(tabConfig.activeTab.id, {"message": "isHyva"});
    });

    getMixins.addEventListener('click', function () {
        chrome.tabs.sendMessage(tabConfig.activeTab.id, {"message": "getMixins"});
    });

    isFastly.addEventListener('click', function () {
        var handleError = function (err) {
            alert("Magento site, but due to Network error, can't check if Magento Cloud");
            console.warn(err);
        };

        if (tabConfig.domain.includes("magentosite.cloud")) {
            alert("MAGENTO CLOUD WEBSITE");
            return;
        }
        var checkRestApi = async function() {
            let url = tabConfig.url.protocol + "//" + tabConfig.domain + "/rest/default/V1/directory/countries";
            let response = await fetch(url);
            return response.ok;
        };

        var checkCname = async function () {
            var response = await (fetch('https://networkcalc.com/api/dns/lookup/' + tabConfig.domain).catch(handleError));
            if (response.ok) {
                var json = await response.json();
                var cname = json?.records?.CNAME[0]?.address;
                if (cname !== undefined) {
                    if (cname == "prod.magentocloud.map.fastly.net") {
                        alert("MAGENTO CLOUD WEBSITE");
                    } else {
                        alert("IT'S MAGENTO, BUT NOT MAGENTO CLOUD WEBSITE");
                    }
                } else {
                    alert("IT'S MAGENTO, BUT NOT MAGENTO CLOUD WEBSITE");
                }
            }
        };
        checkRestApi().then(function(res) {
            if (res) {
                checkCname();
            } else {
                alert("NOT MAGENTO. PROBABLY PWA WEBSITE");
            }
        });
    });

    getPaymentMethods.addEventListener('click', function () {
        chrome.tabs.sendMessage(tabConfig.activeTab.id, {"message": "getPaymentMethods"});
    });

    screenshot.addEventListener('click', function () {
        chrome.runtime.sendMessage({ action: "capture_full_page" });
    });

    webReqs.addEventListener('click', function () {
        webReqs.classList.toggle("loading-bar");
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.runtime.sendMessage({ message: 'getHar', tabId: tabs[0].id });
        });
    });

    checkPayPalSDK.addEventListener('click', function () {
        let newUrl = tabConfig.url.protocol + "//" + tabConfig.domain + "/customer/section/load/?sections=payments";
        resp = fetch(newUrl)
            .then(response => response.text())
            .then(data => {
                alert(JSON.stringify(data, null, 2));
                return JSON.parse(data);
            })
            .catch(error => {
                console.error('Error fetching:', error);
                alert("Error fetching from " + newUrl);
            });
        resp.then((data) => chrome.tabs.sendMessage(tabConfig.activeTab.id, {
            "message": "printSDKHelper",
            "data": data
        }));
    });

    searchInput.addEventListener('keydown', function (event) {
        if (event.keyCode === 13) {
            chrome.tabs.create({url: WIKI_SEARCH.replaceAll("#PLACEHOLDER#", event.currentTarget.value.replace(" ", "+"))});
        }
    });

    collectErrors.addEventListener('click', function () {
        chrome.tabs.sendMessage(tabConfig.activeTab.id, {"message": "collectAllErrors"});
    });

    analyzeWithPerplexity.addEventListener('click', function() {
        chrome.tabs.sendMessage(tabConfig.activeTab.id, {"message": "collectErrors"});
    });
});


// Settings navigation

let openSidePanel = document.getElementById('openDocs');
let closeSidePanel = document.getElementById('closebtn');
openSidePanel.addEventListener('click', function () {
    document.getElementById("mySidenav").style.width = "250px";
});
closeSidePanel.addEventListener('click', function () {
    document.getElementById("mySidenav").style.width = "0";
});
