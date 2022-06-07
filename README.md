Family Tree
===========

My family is complicated, so I copied a tree visualization to make sense of it
all.

Pretty much just copied/pasted what's here:
http://gojs.net/latest/samples/genogram.html

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
