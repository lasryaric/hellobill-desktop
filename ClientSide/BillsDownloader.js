function deepClick(firstCss, parentSteps, secondCss, callback) {
  //document.querySelectorAll("time[title^='2016-01']")[0].parentElement.parentElement.querySelectorAll(".receipt a")[0]

  const firstStage = document.querySelectorAll(firstCss);

  var parents = __hellobill._.map(elems, function(elem) {
    var newElem = elem;

    for (var i = 0; i < parentSteps; i++) {
      if (elem && elem.parentElement)
      newElem = elem.parentElement;
    }

    return newElem;
  });

  __hellobill._.each(parents, (elem) => {
    var clickable = elem.querySelectorAll(secondCss);
    if (clickable && clickable.length > 0) {
      clickable[0].click();
    }
  });
}
