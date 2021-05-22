[Return to Documentation Index](/README.md)

# Custom Drawing

If you want to draw anything onto one of your windows, you'll need to begin by adding a [Paint Handler](callbacks.md#paint-handler) to your Window Class (see [Callbacks](callbacks.md#paint-handler).)  Inside the Paint Handler, you can use standard HTML5 Canvas commands to draw onto the Canvas 2D Context.

The standard library also includes some functions you can call manually which are normally part of the default paint handler.

## Drawing Functions

### [appstyle.drawBackground(win, ctx)](#draw-background)

This paints the background of the window. If you don't call this, or paint the background area yourself, the window will be see-through.

### [appstyle.drawWidgets(win, ctx)](#draw-widgets)

This paints all of the widgets on the window.

### [appstyle.drawText(win, ctx, x, y, w, h, caption)](#draw-text)

This paints text onto the canvas in the same way the default widgets do.

### [appstyle.drawFlatOutline(ctx, ofs, pad, thick, color)](#draw-flat-outline)

This draws a flat colored outline surrounding a rectangular area.

### [appstyle.drawBevel(ctx, ofs, pad, thick, depth, raised, tint)](#draw-bevel)

This draws a beveled outline surrounding a rectangular area.
