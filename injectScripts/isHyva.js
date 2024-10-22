if (window.hyva) {
    dispatchMessages([
        {
            type: "success",
            text: "Yes, this is Hyva!"
        }
    ], 15000);
} else {
    alert("No, this is not Hyva!");
}