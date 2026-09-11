include <genKeyboard.scad>;

baseType=TACTILE6MM;

//assembled preview
assembled(spec,0);

//switch base
//base(spec);

//key spring layer
//springs(spec);

//keys
//keys(spec);

//cover for the keys
//cover(spec);

//keycap font
capFont="Liberation Sans:style=Bold";


//lefthand column 
//placement starts at 0,0 and runs downward 
//x,y coordinates of each key are calculated based on the size and postition of the previous key
col1=genColumn(
  [
    genIsland(txt=[genTxt(txt="–",size=6,font=capFont)]),
    genIsland(txt=[genTxt(txt="°",size=6,dy=-2,dx=2,font=capFont)]),
    genIsland(txt=[genTxt(txt="π",size=6,font=capFont)])
  ]
);

//righthand column
//placement starts at the top right corner of the previous column
col2=genColumn(x=maxx(col1), y=miny(col1),[genIsland(txt=[genTxt(txt="—",size=6,font=capFont)]),
genIsland(txt=[genTxt(txt="²",size=6,dy=-2,dx=2,font=capFont)]),
genIsland(txt=[genTxt(txt="×",size=6,font=capFont)]),
]);

//complete spec for keypad
spec=concat(col1,col2);


