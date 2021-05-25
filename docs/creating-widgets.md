[Return to Documentation Index](/docs/README.md)

# Creating Widgets

## registerWidgetClass(name, props)

Registering a Widget Class lets you specify all of the callbacks necessary for your Widget to be drawn and interacted with.
You can create a library object to hold all of your Widgets (recommended), or load your Widget's constructor directly into the appstyle object:

```js

var myWidgetLibrary = {}

myWidgetLibrary.fancyButton = (function () {

  function paintFancyButton(win, ctx) {
    // to be written later
  }

  appstyle.registerWidgetClass('fancyButton', {
    // widget class callbacks go here:
    paint: paintFancyButton
  });

  // constructor:
  function fancyButton(win, id, caption, props) {
    var o = {
      id: id,
      class: "button",
      caption: caption
    }, props);

    // always cascade the defaultProps onto a new object
    appstyle.internals.addPropsToObject(o, win.private.defaultProps);

    // always apply the user specified props next, to override defaults:
    appstyle.internals.addPropsToObject(o, props);

    // if you need to fill in any omitted properties with default, do it like so:
    if (typeof o.h == "undefined") {
      o.h = 1.5;
    }

    // add the new widget to the window:
    win.private.widgets.push(o);
  }

  return fancyButton;
}());
```

## Widget Class Callbacks

 * inspectorText(win, widget) - return a string show for "Data" in a debugger/inspector
 * paint(win, ctx, widget, ofs) - paint handler
 * getWidgetAtPos(win, widget, x, y, parentReference) - for containers to return child widgets based on location
 * dragging(win, widget) - happens while the widget is being dragged
