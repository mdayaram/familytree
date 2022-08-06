Family Tree
===========

My family is complicated, so I copied a tree visualization to make sense of it
all.

Pretty much just copied/pasted what's here:
http://gojs.net/latest/samples/genogram.html

And the customization properties from here:
https://gojs.net/latest/samples/ldLayout.html

But added the following change since without it I was getting odd connections
to people that were not actually connected. I added 
`routing: go.Link.AvoidsNodes` in the setup.js file under the Marriage relations
properties:

```javascript
      myDiagram.linkTemplateMap.add("Marriage",  // for marriage relationships
        $(go.Link,
          { selectable: false, routing: go.Link.AvoidsNodes },
          $(go.Shape, { strokeWidth: 2.5, stroke: "#5d8cc1" /* blue */ })
        ));
```

I didn't want to write JSON to update the tree, but a text visualization of a
family tree is also pretty confusing.  I used to have a CSV file that was awful
to update.  The current format is based on "households" so you always chunk
two parents and their children together.  I got inspiration for this format from
https://github.com/adrienverge/familytreemaker which is really nice, but had
some bugs when I tried to use it for my family tree, so I opted to build my own.

```bash
$> ./treemaker.rb
```

And then open `index.html` in a browser to see the result.

## TODO

* Implement search-by-name functionality to find someone, and highlight their tree.
* Play around with the different properties to figure out best layout.
* Everything together is a mess, so maybe think about why I want this and how can
  I make it more useful to me.
