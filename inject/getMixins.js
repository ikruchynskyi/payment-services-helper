Object.values(requirejs.s.contexts._.config.config.mixins).forEach(value => {
    Object.keys(value).forEach(key => {
        if (!key.includes("Magento_") && !key.includes("mage/") && !key.includes("jquery")) {
            console.log(key);
        }
    });
});