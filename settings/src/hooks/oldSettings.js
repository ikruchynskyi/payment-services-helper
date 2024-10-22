const APPLE_CERT_OLD = ["7B227073704964223A2246354246304143324336314131413238313043373531453439333444414433384346393037313041303935303844314133453241383436314141363232414145222C2276657273696F6E223A312C22637265617465644F6E223A313633343737323736393531342C227369676E6174757265223A223330383030363039326138363438383666373064303130373032613038303330383030323031303133313066333030643036303936303836343830313635303330343032303130353030333038303036303932613836343838366637306430313037303130303030613038303330383230336533333038323033383861303033303230313032303230383463333034313439353139643534333633303061303630383261383634386365336430343033303233303761333132653330326330363033353530343033306332353431373037303663363532303431373037303663363936333631373436393666366532303439366537343635363737323631373436393666366532303433343132303264323034373333333132363330323430363033353530343062306331643431373037303663363532303433363537323734363936363639363336313734363936663665323034313735373436383666373236393734373933313133333031313036303335353034306130633061343137303730366336353230343936653633326533313062333030393036303335353034303631333032353535333330316531373064333133393330333533313338333033313333333233353337356131373064333233343330333533313336333033313333333233353337356133303566333132353330323330363033353530343033306331633635363336333264373336643730326436323732366636623635373232643733363936373665356635353433333432643530353234663434333131343330313230363033353530343062306330623639346635333230353337393733373436353664373333313133333031313036303335353034306130633061343137303730366336353230343936653633326533313062333030393036303335353034303631333032353535333330353933303133303630373261383634386365336430323031303630383261383634386365336430333031303730333432303030346332313537376564656264366337623232313866363864643730393061313231386463376230626436663263323833643834363039356439346166346135343131623833343230656438313166333430376538333333316631633534633366376562333232306436626164356434656666343932383938393365376330663133613338323032313133303832303230643330306330363033353531643133303130316666303430323330303033303166303630333535316432333034313833303136383031343233663234396334346639336534656632376536633466363238366333666132626266643265346233303435303630383262303630313035303530373031303130343339333033373330333530363038326230363031303530353037333030313836323936383734373437303361326632663666363337333730326536313730373036633635326536333666366432663666363337333730333033343264363137303730366336353631363936333631333333303332333038323031316430363033353531643230303438323031313433303832303131303330383230313063303630393261383634383836663736333634303530313330383166653330383163333036303832623036303130353035303730323032333038316236306338316233353236353663363936313665363336353230366636653230373436383639373332303633363537323734363936363639363336313734363532303632373932303631366537393230373036313732373437393230363137333733373536643635373332303631363336333635373037343631366536333635323036663636323037343638363532303734363836353665323036313730373036633639363336313632366336353230373337343631366536343631373236343230373436353732366437333230363136653634323036333666366536343639373436393666366537333230366636363230373537333635326332303633363537323734363936363639363336313734363532303730366636633639363337393230363136653634323036333635373237343639363636393633363137343639366636653230373037323631363337343639363336353230373337343631373436353664363536653734373332653330333630363038326230363031303530353037303230313136326136383734373437303361326632663737373737373265363137303730366336353265363336663664326636333635373237343639363636393633363137343635363137353734363836663732363937343739326633303334303630333535316431663034326433303262333032396130323761303235383632333638373437343730336132663266363337323663326536313730373036633635326536333666366432663631373037303663363536313639363336313333326536333732366333303164303630333535316430653034313630343134393435376462366664353734383138363839383937363266376535373835303765373962353832343330306530363033353531643066303130316666303430343033303230373830333030663036303932613836343838366637363336343036316430343032303530303330306130363038326138363438636533643034303330323033343930303330343630323231303062653039353731666537316531653733356235356535616661636234633732666562343435663330313835323232633732353130303262363165626436663535303232313030643138623335306135646436646436656231373436303335623131656232636538376366613365366166366362643833383038393064633832636464616136333330383230326565333038323032373561303033303230313032303230383439366432666266336139386461393733303061303630383261383634386365336430343033303233303637333131623330313930363033353530343033306331323431373037303663363532303532366636663734323034333431323032643230343733333331323633303234303630333535303430623063316434313730373036633635323034333635373237343639363636393633363137343639366636653230343137353734363836663732363937343739333131333330313130363033353530343061306330613431373037303663363532303439366536333265333130623330303930363033353530343036313330323535353333303165313730643331333433303335333033363332333333343336333333303561313730643332333933303335333033363332333333343336333333303561333037613331326533303263303630333535303430333063323534313730373036633635323034313730373036633639363336313734363936663665323034393665373436353637373236313734363936663665323034333431323032643230343733333331323633303234303630333535303430623063316434313730373036633635323034333635373237343639363636393633363137343639366636653230343137353734363836663732363937343739333131333330313130363033353530343061306330613431373037303663363532303439366536333265333130623330303930363033353530343036313330323535353333303539333031333036303732613836343863653364303230313036303832613836343863653364303330313037303334323030303466303137313138343139643736343835643531613565323538313037373665383830613265666465376261653464653038646663346239336531333335366435363635623335616532326430393737363064323234653762626130386664373631376365383863623736626236363730626563386538323938346666353434356133383166373330383166343330343630363038326230363031303530353037303130313034336133303338333033363036303832623036303130353035303733303031383632613638373437343730336132663266366636333733373032653631373037303663363532653633366636643266366636333733373033303334326436313730373036633635373236663666373436333631363733333330316430363033353531643065303431363034313432336632343963343466393365346566323765366334663632383663336661326262666432653462333030663036303335353164313330313031666630343035333030333031303166663330316630363033353531643233303431383330313638303134626262306465613135383333383839616134386139396465626562646562616664616362323461623330333730363033353531643166303433303330326533303263613032616130323838363236363837343734373033613266326636333732366332653631373037303663363532653633366636643266363137303730366336353732366636663734363336313637333332653633373236633330306530363033353531643066303130316666303430343033303230313036333031303036306132613836343838366637363336343036303230653034303230353030333030613036303832613836343863653364303430333032303336373030333036343032333033616366373238333531313639396231383666623335633335366361363262666634313765646439306637353464613238656265663139633831356534326237383966383938663739623539396639386435343130643866396465396332666530323330333232646435343432316230613330353737366335646633333833623930363766643137376332633231366439363466633637323639383231323666353466383761376431623939636239623039383932313631303639393066303939323164303030303331383230313863333038323031383830323031303133303831383633303761333132653330326330363033353530343033306332353431373037303663363532303431373037303663363936333631373436393666366532303439366537343635363737323631373436393666366532303433343132303264323034373333333132363330323430363033353530343062306331643431373037303663363532303433363537323734363936363639363336313734363936663665323034313735373436383666373236393734373933313133333031313036303335353034306130633061343137303730366336353230343936653633326533313062333030393036303335353034303631333032353535333032303834633330343134393531396435343336333030643036303936303836343830313635303330343032303130353030613038313935333031383036303932613836343838366637306430313039303333313062303630393261383634383836663730643031303730313330316330363039326138363438383666373064303130393035333130663137306433323331333133303332333033323333333333323334333935613330326130363039326138363438383666373064303130393334333131643330316233303064303630393630383634383031363530333034303230313035303061313061303630383261383634386365336430343033303233303266303630393261383634383836663730643031303930343331323230343230623935666665303261316539316665656565396330623239616361656661643465333031396331666237626238313665366631623762343233346666306533353330306130363038326138363438636533643034303330323034343733303435303232303665356233363937366364383733653632623339326330353136633134326362356639303938663330323535656435343938633436393039356133636462346430323231303038396261626335356162626635653037393163633139373562306535383630633937336532336661313266643338343533303930353938343061326363363337303030303030303030303030227D"];
const APPLE_CERT = "7B227073704964223A2246354246304143324336314131413238313043373531453439333444414433384346393037313041303935303844314133453241383436314141363232414145222C2276657273696F6E223A312C22637265617465644F6E223A313731353230343037313232362C227369676E6174757265223A223330383030363039326138363438383666373064303130373032613038303330383030323031303133313064333030623036303936303836343830313635303330343032303133303830303630393261383634383836663730643031303730313030303061303830333038323033653333303832303338386130303330323031303230323038313636333463386230653330353731373330306130363038326138363438636533643034303330323330376133313265333032633036303335353034303330633235343137303730366336353230343137303730366336393633363137343639366636653230343936653734363536373732363137343639366636653230343334313230326432303437333333313236333032343036303335353034306230633164343137303730366336353230343336353732373436393636363936333631373436393666366532303431373537343638366637323639373437393331313333303131303630333535303430613063306134313730373036633635323034393665363332653331306233303039303630333535303430363133303235353533333031653137306433323334333033343332333933313337333433373332333735613137306433323339333033343332333833313337333433373332333635613330356633313235333032333036303335353034303330633163363536333633326437333664373032643632373236663662363537323264373336393637366535663535343333343264353035323466343433313134333031323036303335353034306230633062363934663533323035333739373337343635366437333331313333303131303630333535303430613063306134313730373036633635323034393665363332653331306233303039303630333535303430363133303235353533333035393330313330363037326138363438636533643032303130363038326138363438636533643033303130373033343230303034633231353737656465626436633762323231386636386464373039306131323138646337623062643666326332383364383436303935643934616634613534313162383334323065643831316633343037653833333331663163353463336637656233323230643662616435643465666634393238393839336537633066313361333832303231313330383230323064333030633036303335353164313330313031666630343032333030303330316630363033353531643233303431383330313638303134323366323439633434663933653465663237653663346636323836633366613262626664326534623330343530363038326230363031303530353037303130313034333933303337333033353036303832623036303130353035303733303031383632393638373437343730336132663266366636333733373032653631373037303663363532653633366636643266366636333733373033303334326436313730373036633635363136393633363133333330333233303832303131643036303335353164323030343832303131343330383230313130333038323031306330363039326138363438383666373633363430353031333038316665333038316333303630383262303630313035303530373032303233303831623630633831623335323635366336393631366536333635323036663665323037343638363937333230363336353732373436393636363936333631373436353230363237393230363136653739323037303631373237343739323036313733373337353664363537333230363136333633363537303734363136653633363532303666363632303734363836353230373436383635366532303631373037303663363936333631363236633635323037333734363136653634363137323634323037343635373236643733323036313665363432303633366636653634363937343639366636653733323036663636323037353733363532633230363336353732373436393636363936333631373436353230373036663663363936333739323036313665363432303633363537323734363936363639363336313734363936663665323037303732363136333734363936333635323037333734363137343635366436353665373437333265333033363036303832623036303130353035303730323031313632613638373437343730336132663266373737373737326536313730373036633635326536333666366432663633363537323734363936363639363336313734363536313735373436383666373236393734373932663330333430363033353531643166303432643330326233303239613032376130323538363233363837343734373033613266326636333732366332653631373037303663363532653633366636643266363137303730366336353631363936333631333332653633373236633330316430363033353531643065303431363034313439343537646236666435373438313836383938393736326637653537383530376537396235383234333030653036303335353164306630313031666630343034303330323037383033303066303630393261383634383836663736333634303631643034303230353030333030613036303832613836343863653364303430333032303334393030333034363032323130306336663032336362323631346262333033383838613136323938336531613933663130353666353066613738636462396261346361323431636331346532356530323231303062653363643064666431363234376636343934343735333830653964343463323238613130383930613361316463373234623862346362383838393831386263333038323032656533303832303237356130303330323031303230323038343936643266626633613938646139373330306130363038326138363438636533643034303330323330363733313162333031393036303335353034303330633132343137303730366336353230353236663666373432303433343132303264323034373333333132363330323430363033353530343062306331643431373037303663363532303433363537323734363936363639363336313734363936663665323034313735373436383666373236393734373933313133333031313036303335353034306130633061343137303730366336353230343936653633326533313062333030393036303335353034303631333032353535333330316531373064333133343330333533303336333233333334333633333330356131373064333233393330333533303336333233333334333633333330356133303761333132653330326330363033353530343033306332353431373037303663363532303431373037303663363936333631373436393666366532303439366537343635363737323631373436393666366532303433343132303264323034373333333132363330323430363033353530343062306331643431373037303663363532303433363537323734363936363639363336313734363936663665323034313735373436383666373236393734373933313133333031313036303335353034306130633061343137303730366336353230343936653633326533313062333030393036303335353034303631333032353535333330353933303133303630373261383634386365336430323031303630383261383634386365336430333031303730333432303030346630313731313834313964373634383564353161356532353831303737366538383061326566646537626165346465303864666334623933653133333536643536363562333561653232643039373736306432323465376262613038666437363137636538386362373662623636373062656338653832393834666635343435613338316637333038316634333034363036303832623036303130353035303730313031303433613330333833303336303630383262303630313035303530373330303138363261363837343734373033613266326636663633373337303265363137303730366336353265363336663664326636663633373337303330333432643631373037303663363537323666366637343633363136373333333031643036303335353164306530343136303431343233663234396334346639336534656632376536633466363238366333666132626266643265346233303066303630333535316431333031303166663034303533303033303130316666333031663036303335353164323330343138333031363830313462626230646561313538333338383961613438613939646562656264656261666461636232346162333033373036303335353164316630343330333032653330326361303261613032383836323636383734373437303361326632663633373236633265363137303730366336353265363336663664326636313730373036633635373236663666373436333631363733333265363337323663333030653036303335353164306630313031666630343034303330323031303633303130303630613261383634383836663736333634303630323065303430323035303033303061303630383261383634386365336430343033303230333637303033303634303233303361636637323833353131363939623138366662333563333536636136326266663431376564643930663735346461323865626566313963383135653432623738396638393866373962353939663938643534313064386639646539633266653032333033323264643534343231623061333035373736633564663333383362393036376664313737633263323136643936346663363732363938323132366635346638376137643162393963623962303938393231363130363939306630393932316430303030333138323031383833303832303138343032303130313330383138363330376133313265333032633036303335353034303330633235343137303730366336353230343137303730366336393633363137343639366636653230343936653734363536373732363137343639366636653230343334313230326432303437333333313236333032343036303335353034306230633164343137303730366336353230343336353732373436393636363936333631373436393666366532303431373537343638366637323639373437393331313333303131303630333535303430613063306134313730373036633635323034393665363332653331306233303039303630333535303430363133303235353533303230383136363334633862306533303537313733303062303630393630383634383031363530333034303230316130383139333330313830363039326138363438383666373064303130393033333130623036303932613836343838366637306430313037303133303163303630393261383634383836663730643031303930353331306631373064333233343330333533303338333233313333333433333331356133303238303630393261383634383836663730643031303933343331316233303139333030623036303936303836343830313635303330343032303161313061303630383261383634386365336430343033303233303266303630393261383634383836663730643031303930343331323230343230353936643939343335373738303366313137346361653066633761343164383634653964366266336535363638646164356563393334303937313439633762623330306130363038326138363438636533643034303330323034343733303435303232313030383565623363643837343731346466343461333830373838643439626537656630303630643765313236633966653638663261333336386363623233373363643032323035366535336363363330376433393561643465663532376234333531323462616636653761383537363030616463376135343561333862613039376139643734303030303030303030303030227D";
const WIKI_SEARCH = "https://wiki.corp.adobe.com/dosearchsite.action?cql=siteSearch+~+%22#PLACEHOLDER#%22+and+space+in+(%22CTAGRP%22%2C%22CENG%22)+and+type+%3D+%22page%22&queryString=#PLACEHOLDER#";

let checkApplePay = function(tabConfig) {
    let newUrl = tabConfig.url.protocol + "//" + tabConfig.domain + "/.well-known/apple-developer-merchantid-domain-association";
    fetch(newUrl)
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
};
// document.addEventListener('click', function(event) {
//     const target = event.target;
//     if (target.tagName === 'BUTTON' || target.tagName === 'A') {
//         const formData = new FormData();
//         formData.append('event', target.id);
//         fetch('https://master-7rqtwti-ppm5n3o2bd4e4.us-4.magentosite.cloud/analytics.php', {
//             method: 'POST',
//             body: formData
//         }).then((res) => {
//             console.log(res);
//         });
//     }
// });
//
// document.querySelectorAll('.content a').forEach(function(element) {
//     element.addEventListener('click', function(event) {
//         event.preventDefault();
//     });
// });
//
// document.addEventListener('DOMContentLoaded', function () {
//     var tabConfig = {};
//     chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
//         tabConfig.activeTab = tabs[0];
//         tabConfig.activeTabUrl = tabs[0].url;
//         tabConfig.url = new URL(tabs[0].url);
//         tabConfig.domain = new URL(tabs[0].url).hostname;
//     });
//
//     var applePay = document.getElementById('validateApplePayCert');
//     var checkPayPalSDK = document.getElementById('getPayPalSDK');
//     var checkEnabledPaymentMethods = document.getElementById('checkEnabledPaymentMethods');
//     var getPaymentMethods = document.getElementById('getPaymentMethods');
//     var searchInput = document.getElementById('searchQuery');
//     var webReqs = document.getElementById('webReqs');
//     var isFastly = document.getElementById('isFastly');
//     var isHyva = document.getElementById('isHyva');
//     var getMixins = document.getElementById('getMixins');
//
//     applePay.addEventListener('click', function () {
//         let newUrl = tabConfig.url.protocol + "//" + tabConfig.domain + "/.well-known/apple-developer-merchantid-domain-association";
//         fetch(newUrl)
//             .then(response => response.text())
//             .then(data => {
//                 if (data === APPLE_CERT) {
//                     alert("Apple Certificate is VALID");
//                 } else if (APPLE_CERT_OLD.includes(data)) {
//                     alert("Old payment services certificate detected! Please update Payment Services module");
//                 }
//                 else {
//                     alert("Apple Certificate is NOT VALID:\n Console command to share with client copied to the clipboard\n" + data);
//                     navigator.clipboard.writeText("Please analyse if Apple Pay Domain Verification certificate is accessible. Next CLI command can help with investigation: \ncurl -IL " + tabConfig.url.protocol + "//" + tabConfig.domain + "/.well-known/apple-developer-merchantid-domain-association");
//                 }
//             })
//             .catch(error => {
//                 console.error('Error fetching:', error);
//                 alert("Error fetching from " + newUrl);
//             });
//     });
//
//     checkEnabledPaymentMethods.addEventListener('click', function () {
//         chrome.tabs.sendMessage(tabConfig.activeTab.id, {"message": "checkEnabledPaymentMethods"});
//     });
//
//     isHyva.addEventListener('click', function () {
//         chrome.tabs.sendMessage(tabConfig.activeTab.id, {"message": "isHyva"});
//     });
//
//     getMixins.addEventListener('click', function () {
//         chrome.tabs.sendMessage(tabConfig.activeTab.id, {"message": "getMixins"});
//     });
//
//     isFastly.addEventListener('click', function () {
//         var handleError = function (err) {
//             alert("Network error");
//             console.warn(err);
//         };
//
//         if (tabConfig.domain.includes("magentosite.cloud")) {
//             alert("MAGENTO CLOUD WEBSITE");
//             return;
//         }
//         var checkRestApi = async function() {
//             let url = tabConfig.url.protocol + "//" + tabConfig.domain + "/rest/default/V1/directory/countries";
//             let response = await fetch(url);
//             return response.ok;
//         };
//
//         var checkCname = async function () {
//             var response = await (fetch('https://networkcalc.com/api/dns/lookup/' + tabConfig.domain).catch(handleError));
//             if (response.ok) {
//                 var json = await response.json();
//                 var cname = json?.records?.CNAME[0]?.address;
//                 if (cname !== undefined) {
//                     if (cname == "prod.magentocloud.map.fastly.net") {
//                         alert("MAGENTO CLOUD WEBSITE");
//                     } else {
//                         alert("IT'S MAGENTO, BUT NOT MAGENTO CLOUD WEBSITE");
//                     }
//                 } else {
//                     alert("IT'S MAGENTO, BUT NOT MAGENTO CLOUD WEBSITE");
//                 }
//             }
//         };
//         checkRestApi().then(function(res) {
//             if (res) {
//                 checkCname();
//             } else {
//                 alert("NOT MAGENTO. PROBABLY PWA WEBSITE");
//             }
//         });
//     });
//
//     getPaymentMethods.addEventListener('click', function () {
//         chrome.tabs.sendMessage(tabConfig.activeTab.id, {"message": "getPaymentMethods"});
//     });
//
//     webReqs.addEventListener('click', function () {
//         chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
//             chrome.runtime.sendMessage({ message: 'getHar', tabId: tabs[0].id });
//         });
//     });
//
//     checkPayPalSDK.addEventListener('click', function () {
//         let newUrl = tabConfig.url.protocol + "//" + tabConfig.domain + "/customer/section/load/?sections=payments";
//         resp = fetch(newUrl)
//             .then(response => response.text())
//             .then(data => {
//                 alert(JSON.stringify(data, null, 2));
//                 return JSON.parse(data);
//             })
//             .catch(error => {
//                 console.error('Error fetching:', error);
//                 alert("Error fetching from " + newUrl);
//             });
//         resp.then((data) => chrome.tabs.sendMessage(tabConfig.activeTab.id, {
//             "message": "printSDKHelper",
//             "data": data
//         }));
//     });
//
//     searchInput.addEventListener('keydown', function (event) {
//         if (event.keyCode === 13) {
//             chrome.tabs.create({url: WIKI_SEARCH.replaceAll("#PLACEHOLDER#", event.currentTarget.value.replace(" ", "+"))});
//         }
//     });
// });


// Settings navigation
//
// let openSidePanel = document.getElementById('openDocs');
// let closeSidePanel = document.getElementById('closebtn');
// openSidePanel.addEventListener('click', function () {
//     document.getElementById("mySidenav").style.width = "250px";
// });
// closeSidePanel.addEventListener('click', function () {
//     document.getElementById("mySidenav").style.width = "0";
// });
