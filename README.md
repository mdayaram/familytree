Family Tree
===========

My family is complicated, so I copied a tree visualization to make sense of it
all.

Pretty much just copied/pasted what's here:
http://gojs.net/latest/samples/genogram.html

I didn't want to write JSON to update the tree, so I made a ruby script to
parse a CSV style file, `people.dat` and generate the JSON for me.  Simply run

```bash
$> ./generate.rb
```

And then open `index.html` in a browser to see the result.
