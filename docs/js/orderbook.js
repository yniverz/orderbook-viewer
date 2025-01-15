// get get params
const urlParams = new URLSearchParams(window.location.search);
const params = {};
for (const [key, value] of urlParams) {
    params[key] = value;
}

// check for param platformclass
let platformName = params.platformname;
let platformClass = params.platformclass;

// import "js/platforms/{platformName}.js"
// and instantiate {platformClass} with all remaining params
let platform = null;
import(`./js/platforms/${platformName}.js`)
    .then(module => {
        platform = new module[platformClass](params);

        platform.setOnMessageHandler(message => {
            console.log(message);
        });

        platform.connect();
    })
    .catch(err => {
        console.error(err);
    });