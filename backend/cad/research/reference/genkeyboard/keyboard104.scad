include <genKeyboard.scad>;

//a 104 key keyboard, separated into 3 sections for easier printing

symFont="OpenSymbol:style=Regular"; //symbol font
defFont="Roboto:style=Bold"; //default font
baseType=TACTILE6MM; //6mm switch base



//assembled view
//preview(0,0);

//exploded view
//preview(10,10);

//comment and uncomment the lines below to render each piece

//render left section pieces
//base(section1);
//springs(section1);
//cover(section1);
//keys(section1);

//render middle section pieces
//base(section2);
//springs(section2);
//cover(section2);
//keys(section2);

//render right section pieces
base(section3);
//springs(section3);
//cover(section3);
//keys(section3);




//render all layers of all 3 sections
module preview(hspacing=0,yspacing=0)
{
  translate([-hspacing,0,0])
  assembled(section1,yspacing/10);
  assembled(section2,yspacing/10);
  translate([hspacing,0,0])
  assembled(section3,yspacing/10);
}


//left section
//row 1
s1r1=genRow(x=0,y=0,spec=[
  genIsland(w=19,kw=16,d=19,kd=16,txt=[genTxt(txt="Esc",size=4,font=defFont,dx=-4,dy=-4)]),
  genSpacer(w=19,d=19),
  genIsland(w=19,kw=16,d=19,kd=16,txt=[genTxt(txt="F1",size=4,font=defFont,dx=-4,dy=-4)]),
  genIsland(w=19,kw=16,d=19,kd=16,txt=[genTxt(txt="F2",size=4,font=defFont,dx=-4,dy=-4)]),
  genIsland(w=19,kw=16,d=19,kd=16,txt=[genTxt(txt="F3",size=4,font=defFont,dx=-4,dy=-4)]),
  genIsland(kw=16,d=19,kd=16,txt=[genTxt(txt="F4",size=4,font=defFont,dx=-4,dy=-4)]),
  genSpacer(w=9.5,d=19),
  genIsland(w=19,kw=16,d=19,kd=16,txt=[genTxt(txt="F5",size=4,font=defFont,dx=-4,dy=-4)]),
  genIsland(w=19,kw=16,d=19,kd=16,txt=[genTxt(txt="F6",size=4,font=defFont,dx=-4,dy=-4)]),
  genIsland(w=19,kw=16,d=19,kd=16,txt=[genTxt(txt="F7",size=4,font=defFont,dx=-4,dy=-4)])
]);

//gap below function keys
s1r1a = [genSpacer(x=minx(s1r1),y=maxy(s1r1),w=maxx(s1r1),d=9.5)];

//row2
s1r2 = genRow(x=minx(s1r1a),y=maxy(s1r1a),spec=[
  genIsland(w=19,kw=16,d=19,kd=16,txt=[genTxt(txt="~",size=4,font=defFont,dx=-4,dy=-4),genTxt(txt="`",size=4,font=defFont,dx=-4,dy=4)]),
  genIsland(w=19,kw=16,d=19,kd=16,txt=[genTxt(txt="!",size=4,font=defFont,dx=-4,dy=-4),genTxt(txt="1",size=4,font=defFont,dx=-4,dy=4)]),
  genIsland(w=19,kw=16,d=19,kd=16,txt=[genTxt(txt="@",size=4,font=defFont,dx=-4,dy=-4),genTxt(txt="2",size=4,font=defFont,dx=-4,dy=4)]),
  genIsland(w=19,kw=16,d=19,kd=16,txt=[genTxt(txt="#",size=4,font=defFont,dx=-4,dy=-4),genTxt(txt="3",size=4,font=defFont,dx=-4,dy=4)]),
  genIsland(w=19,kw=16,d=19,kd=16,txt=[genTxt(txt="$",size=4,font=defFont,dx=-4,dy=-4),genTxt(txt="4",size=4,font=defFont,dx=-4,dy=4)]),
  genIsland(w=19,kw=16,d=19,kd=16,txt=[genTxt(txt="%",size=4,font=defFont,dx=-4,dy=-4),genTxt(txt="5",size=4,font=defFont,dx=-4,dy=4)]),
  genIsland(w=19,kw=16,d=19,kd=16,txt=[genTxt(txt="^",size=4,font=defFont,dx=-4,dy=-4),genTxt(txt="6",size=4,font=defFont,dx=-4,dy=4)]),
  genIsland(w=19,kw=16,d=19,kd=16,txt=[genTxt(txt="&",size=4,font=defFont,dx=-4,dy=-4),genTxt(txt="7",size=4,font=defFont,dx=-4,dy=4)]),
  genIsland(w=19,kw=16,d=19,kd=16,txt=[genTxt(txt="*",size=4,font=defFont,dx=-4,dy=-4),genTxt(txt="8",size=4,font=defFont,dx=-4,dy=4)]),
  genIsland(w=19,kw=16,d=19,kd=16,txt=[genTxt(txt="(",size=4,font=defFont,dx=-4,dy=-4),genTxt(txt="9",size=4,font=defFont,dx=-4,dy=4)]),
]);

//row 3
s1r3 = genRow(x=minx(s1r2),y=maxy(s1r2),spec=[
  genIsland(w=28.5,kw=25.5,d=19,kd=16,txt=[genTxt(txt="Tab",size=4,font=defFont,dx=-7,dy=-4)]),
  genIsland(w=19,kw=16,d=19,kd=16,txt=[genTxt(txt="Q",size=4,font=defFont,dx=-4,dy=-4)]),
  genIsland(w=19,kw=16,d=19,kd=16,txt=[genTxt(txt="W",size=4,font=defFont,dx=-4,dy=-4)]),
  genIsland(w=19,kw=16,d=19,kd=16,txt=[genTxt(txt="E",size=4,font=defFont,dx=-4,dy=-4)]),
  genIsland(w=19,kw=16,d=19,kd=16,txt=[genTxt(txt="R",size=4,font=defFont,dx=-4,dy=-4)]),
  genIsland(w=19,kw=16,d=19,kd=16,txt=[genTxt(txt="T",size=4,font=defFont,dx=-4,dy=-4)]),
  genIsland(w=19,kw=16,d=19,kd=16,txt=[genTxt(txt="Y",size=4,font=defFont,dx=-4,dy=-4)]),
  genIsland(w=19,kw=16,d=19,kd=16,txt=[genTxt(txt="U",size=4,font=defFont,dx=-4,dy=-4)]),
  genIsland(w=19,kw=16,d=19,kd=16,txt=[genTxt(txt="I",size=4,font=defFont,dx=-4,dy=-4)])
]);

//row 4
s1r4 = genRow(x=minx(s1r3),y=maxy(s1r3),spec=[
  genIsland(w=33.25,kw=30.25,d=19,kd=16,txt=[genTxt(txt="Caps Lock",size=4,font=defFont,dx=0,dy=-4)]),
  genIsland(w=19,kw=16,d=19,kd=16,txt=[genTxt(txt="A",size=4,font=defFont,dx=-4,dy=-4)]),
  genIsland(w=19,kw=16,d=19,kd=16,txt=[genTxt(txt="S",size=4,font=defFont,dx=-4,dy=-4)]),
  genIsland(w=19,kw=16,d=19,kd=16,txt=[genTxt(txt="D",size=4,font=defFont,dx=-4,dy=-4)]),
  genIsland(w=19,kw=16,d=19,kd=16,txt=[genTxt(txt="F",size=4,font=defFont,dx=-4,dy=-4)]),
  genIsland(w=19,kw=16,d=19,kd=16,txt=[genTxt(txt="G",size=4,font=defFont,dx=-4,dy=-4)]),
  genIsland(w=19,kw=16,d=19,kd=16,txt=[genTxt(txt="H",size=4,font=defFont,dx=-4,dy=-4)]),
  genIsland(w=19,kw=16,d=19,kd=16,txt=[genTxt(txt="J",size=4,font=defFont,dx=-4,dy=-4)]),
  genIsland(w=19,kw=16,d=19,kd=16,txt=[genTxt(txt="K",size=4,font=defFont,dx=-4,dy=-4)])
]);

//row 5
s1r5 = genRow(x=minx(s1r4),y=maxy(s1r4),spec=[
  genIsland(w=42.75,kw=39.75,d=19,kd=16,txt=[genTxt(txt="Shift",size=4,font=defFont,dx=-11,dy=-4)]),
  genIsland(w=19,kw=16,d=19,kd=16,txt=[genTxt(txt="Z",size=4,font=defFont,dx=-4,dy=-4)]),
  genIsland(w=19,kw=16,d=19,kd=16,txt=[genTxt(txt="X",size=4,font=defFont,dx=-4,dy=-4)]),
  genIsland(w=19,kw=16,d=19,kd=16,txt=[genTxt(txt="C",size=4,font=defFont,dx=-4,dy=-4)]),
  genIsland(w=19,kw=16,d=19,kd=16,txt=[genTxt(txt="V",size=4,font=defFont,dx=-4,dy=-4)]),
  genIsland(w=19,kw=16,d=19,kd=16,txt=[genTxt(txt="B",size=4,font=defFont,dx=-4,dy=-4)]),
  genIsland(w=19,kw=16,d=19,kd=16,txt=[genTxt(txt="N",size=4,font=defFont,dx=-4,dy=-4)]),
  genIsland(w=19,kw=16,d=19,kd=16,txt=[genTxt(txt="M",size=4,font=defFont,dx=-4,dy=-4)])
]);


//row 6
s1r6=genRow(x=minx(s1r5),y=maxy(s1r5),spec=[
  genIsland(w=23.75,kw=20.75,d=19,kd=16,txt=[genTxt(txt="Ctrl",size=4,font=defFont,dx=-4,dy=-4)]),
  genIsland(w=23.75,kw=20.75,d=19,kd=16,txt=[genTxt(txt="Win",size=4,font=defFont,dx=-4,dy=-4)]),
  genIsland(w=23.75,kw=20.75,d=19,kd=16,txt=[genTxt(txt="Alt",size=4,font=defFont,dx=-4,dy=-4)]),
  //special case: spacebar need extra support
  genIsland(w=118.75,kw=115.75,d=19,kd=16,txt=[genTxt(txt="",size=4,font=defFont,dx=-4,dy=-4)],spx=true,sps=30)
]);

//complete left section
section1 = concat(s1r1,s1r1a,s1r2,s1r3,s1r4,s1r5,s1r6);



//===========================================
//middle section - each row is a continuation of the corresponding row in section 1
//row 1
s2r1=genRow(x=maxx(s1r1),y=miny(s1r1),spec=[
  genIsland(w=19,kw=16,d=19,kd=16,txt=[genTxt(txt="F8",size=4,font=defFont,dx=-4,dy=-4)]),
  genSpacer(w=9.5,d=19),
  genIsland(w=19,kw=16,d=19,kd=16,txt=[genTxt(txt="F9",size=4,font=defFont,dx=-4,dy=-4)]),
  genIsland(w=19,kw=16,d=19,kd=16,txt=[genTxt(txt="F10",size=4,font=defFont,dx=-2,dy=-4)]),
  genIsland(w=19,kw=16,d=19,kd=16,txt=[genTxt(txt="F11",size=4,font=defFont,dx=-2,dy=-4)]),
  genIsland(w=19,kw=16,d=19,kd=16,txt=[genTxt(txt="F12",size=4,font=defFont,dx=-2,dy=-4)]),
  genSpacer(w=4.75,d=19),
  genIsland(w=19,kw=16,d=19,kd=16,txt=[genTxt(txt="PrtSc",size=4,font=defFont,dx=0,dy=-4)]),
  genIsland(w=19,kw=16,d=19,kd=16,txt=[genTxt(txt="Scroll",size=4,font=defFont,dx=0,dy=-4),genTxt(txt="Lock",size=4,font=defFont,dx=-1,dy=3)]),
  genIsland(w=19,kw=16,d=19,kd=16,txt=[genTxt(txt="Pause",size=4,font=defFont,dx=0,dy=-4),genTxt(txt="Break",size=4,font=defFont,dx=0,dy=3)]),
  genSpacer(w=3,d=19)
]);

//gap below function keys
s2r1a = [genSpacer(x=minx(s2r1),y=maxy(s2r1),w=maxx(s2r1)-minx(s2r1),d=9.5)];

//row2
s2r2 = genRow(x=maxx(s1r2),y=maxy(s2r1a),spec=[
  genIsland(w=19,kw=16,d=19,kd=16,txt=[genTxt(txt=")",size=4,font=defFont,dx=-4,dy=-4),genTxt(txt="0",size=4,font=defFont,dx=-4,dy=4)]),
  genIsland(w=19,kw=16,d=19,kd=16,txt=[genTxt(txt="_",size=4,font=defFont,dx=-4,dy=-4),genTxt(txt="-",size=4,font=defFont,dx=-4,dy=4)]),
  genIsland(w=19,kw=16,d=19,kd=16,txt=[genTxt(txt="+",size=4,font=defFont,dx=-4,dy=-4),genTxt(txt="=",size=4,font=defFont,dx=-4,dy=4)]),
  genIsland(w=38,kw=35,d=19,kd=16,txt=[genTxt(txt="Backspace",size=4,font=defFont,dx=0,dy=-4)]),
  genSpacer(w=4.75,d=19),
  genIsland(w=19,kw=16,d=19,kd=16,txt=[genTxt(txt="Insert",size=4,font=defFont,dx=0,dy=-4)]),
  genIsland(w=19,kw=16,d=19,kd=16,txt=[genTxt(txt="Home",size=4,font=defFont,dx=0,dy=-4)]),
  genIsland(w=19,kw=16,d=19,kd=16,txt=[genTxt(txt="PgUp",size=4,font=defFont,dx=0,dy=-4)]),
  genSpacer(w=3,d=19)
]);

//row 3
s2r3 = genRow(x=maxx(s1r3),y=maxy(s2r2),spec=[
  genIsland(w=19,kw=16,d=19,kd=16,txt=[genTxt(txt="O",size=4,font=defFont,dx=-4,dy=-4)]),
  genIsland(w=19,kw=16,d=19,kd=16,txt=[genTxt(txt="P",size=4,font=defFont,dx=-4,dy=-4)]),
  genIsland(w=19,kw=16,d=19,kd=16,txt=[genTxt(txt="{",size=4,font=defFont,dx=-4,dy=-4),genTxt(txt="[",size=4,font=defFont,dx=-4,dy=4)]),
  genIsland(w=19,kw=16,d=19,kd=16,txt=[genTxt(txt="}",size=4,font=defFont,dx=-4,dy=-4),genTxt(txt="]",size=4,font=defFont,dx=-4,dy=4)]),
  genIsland(w=28.5,kw=25.5,d=19,kd=16,txt=[genTxt(txt="|",size=4,font=defFont,dx=-4,dy=-4),genTxt(txt="\\",size=4,font=defFont,dx=-4,dy=4)]),
  genSpacer(w=4.75,d=19),
  genIsland(w=19,kw=16,d=19,kd=16,txt=[genTxt(txt="Delete",size=4,font=defFont,dx=0,dy=-4)]),
  genIsland(w=19,kw=16,d=19,kd=16,txt=[genTxt(txt="End",size=4,font=defFont,dx=0,dy=-4)]),
  genIsland(w=19,kw=16,d=19,kd=16,txt=[genTxt(txt="PgDn",size=4,font=defFont,dx=0,dy=-4)]),
  genSpacer(w=3,d=19)
]);

//row 4
s2r4 = genRow(x=maxx(s1r4),y=maxy(s2r3),spec=[
  genIsland(w=19,kw=16,d=19,kd=16,txt=[genTxt(txt="L",size=4,font=defFont,dx=-4,dy=-4)]),
  genIsland(w=19,kw=16,d=19,kd=16,txt=[genTxt(txt=":",size=4,font=defFont,dx=-4,dy=-4),genTxt(txt=";",size=4,font=defFont,dx=-4,dy=4)]),
  genIsland(w=19,kw=16,d=19,kd=16,txt=[genTxt(txt="\"",size=4,font=defFont,dx=-4,dy=-4),genTxt(txt="'",size=4,font=defFont,dx=-4,dy=4)]),
  genIsland(w=42.75,kw=39.75,d=19,kd=16,txt=[genTxt(txt="Enter",size=4,font=defFont,dx=-9,dy=-4)]),
  genSpacer(w=65,d=19)
]);

//row 5
s2r5 = genRow(x=maxx(s1r5),y=maxy(s2r4),spec=[
  genIsland(w=19,kw=16,d=19,kd=16,txt=[genTxt(txt="<",size=4,font=defFont,dx=-4,dy=-4),genTxt(txt=",",size=4,font=defFont,dx=-4,dy=4)]),
  genIsland(w=19,kw=16,d=19,kd=16,txt=[genTxt(txt=">",size=4,font=defFont,dx=-4,dy=-4),genTxt(txt=".",size=4,font=defFont,dx=-4,dy=4)]),
  genIsland(w=19,kw=16,d=19,kd=16,txt=[genTxt(txt="?",size=4,font=defFont,dx=-4,dy=-4),genTxt(txt="/",size=4,font=defFont,dx=-4,dy=4)]),
  genIsland(w=52.25,kw=49.25,d=19,kd=16,txt=[genTxt(txt="Shift",size=4,font=defFont,dx=-14,dy=-4)]),
  genSpacer(w=23.75,d=19),
  genIsland(w=19,kw=16,d=19,kd=16,txt=[genTxt(txt="↑",size=4,font=symFont,dx=-4,dy=-4)]),
  genSpacer(w=22.25,d=19)
]);


//row 6
s2r6=genRow(x=maxx(s1r6),y=maxy(s2r5),spec=[
  genIsland(w=23.75,kw=20.75,d=19,kd=16,txt=[genTxt(txt="Alt",size=4,font=defFont,dx=-4,dy=-4)]),
  genIsland(w=23.75,kw=20.75,d=19,kd=16,txt=[genTxt(txt="Win",size=4,font=defFont,dx=-4,dy=-4)]),
  genIsland(w=23.75,kw=20.75,d=19,kd=16,txt=[genTxt(txt="Menu",size=4,font=defFont,dx=-2,dy=-4)]),
  genIsland(w=23.75,kw=20.75,d=19,kd=16,txt=[genTxt(txt="Ctrl",size=4,font=defFont,dx=-4,dy=-4)]),
  genSpacer(w=4.75,d=19),
  genIsland(w=19,kw=16,d=19,kd=16,txt=[genTxt(txt="←",size=4,font=symFont,dx=-4,dy=-4)]),
  genIsland(w=19,kw=16,d=19,kd=16,txt=[genTxt(txt="↓",size=4,font=symFont,dx=-4,dy=-4)]),
  genIsland(w=19,kw=16,d=19,kd=16,txt=[genTxt(txt="→",size=4,font=symFont,dx=-4,dy=-4)]),
  genSpacer(w=3.25,d=19)
]);


//complete middle section
section2 = concat(s2r1,s2r1a,s2r2,s2r3,s2r4,s2r5,s2r6);



//===========================================
//right section (number pad) - each row is a continuation of the corresponding row in section 2

//row2 - gernerating this before row 1 to get width of spacer
s3r2 = genRow(x=maxx(s2r2),y=maxy(s2r1a),spec=[
genSpacer(w=1.75,d=19),
genIsland(w=19,kw=16,d=19,kd=16,txt=[genTxt(txt="Num",size=4,font=defFont,dx=-1,dy=-4),genTxt(txt="Lock",size=4,font=defFont,dx=0,dy=3)]),
genIsland(w=19,kw=16,d=19,kd=16,txt=[genTxt(txt="/",size=4,font=defFont,dx=-4,dy=-4)]),
genIsland(w=19,kw=16,d=19,kd=16,txt=[genTxt(txt="*",size=4,font=defFont,dx=-4,dy=-4)]),
genIsland(w=19,kw=16,d=19,kd=16,txt=[genTxt(txt="-",size=4,font=defFont,dx=-4,dy=-4)]),
]);

//row 1 empty space above num pad
s3r1=genRow(x=maxx(s2r1),y=miny(s2r1),spec=[
genSpacer(w=maxx(s3r2)-minx(s3r2),d=maxy(s2r1a)),
]);


//row 3
s3r3 = genRow(x=maxx(s2r3),y=maxy(s3r2),spec=[
genSpacer(w=1.75,d=19),
genIsland(w=19,kw=16,d=19,kd=16,txt=[genTxt(txt="7",size=4,font=defFont,dx=-4,dy=-4),genTxt(txt="Home",size=4,font=defFont,dx=0,dy=3)]),
genIsland(w=19,kw=16,d=19,kd=16,txt=[genTxt(txt="8",size=4,font=defFont,dx=-4,dy=-4),genTxt(txt="↑",size=4,font=symFont,dx=0,dy=3)]),
genIsland(w=19,kw=16,d=19,kd=16,txt=[genTxt(txt="9",size=4,font=defFont,dx=-4,dy=-4),genTxt(txt="PgUp",size=4,font=defFont,dx=0,dy=3)]),
genIsland(w=19,kw=16,d=38,kd=35,txt=[genTxt(txt="+",size=4,font=defFont,dx=-4,dy=-10)]),
]);

//row 4
s3r4 = genRow(x=maxx(s2r4),y=maxy(s2r3),spec=[
genSpacer(w=1.75,d=19),
genIsland(w=19,kw=16,d=19,kd=16,txt=[genTxt(txt="4",size=4,font=symFont,dx=-4,dy=-4),genTxt(txt="←",size=4,font=symFont,dx=-4,dy=4)]),
genIsland(w=19,kw=16,d=19,kd=16,txt=[genTxt(txt="5",size=4,font=defFont,dx=-4,dy=-4)]),
genIsland(w=19,kw=16,d=19,kd=16,txt=[genTxt(txt="6",size=4,font=defFont,dx=-4,dy=-4),genTxt(txt="→",size=4,font=symFont,dx=-4,dy=4)]),
]);

//row 5
s3r5 = genRow(x=maxx(s2r5),y=maxy(s3r4),spec=[
genSpacer(w=1.75,d=19),
genIsland(w=19,kw=16,d=19,kd=16,txt=[genTxt(txt="1",size=4,font=defFont,dx=-4,dy=-4),genTxt(txt="End",size=4,font=defFont,dx=-1,dy=3)]),
genIsland(w=19,kw=16,d=19,kd=16,txt=[genTxt(txt="2",size=4,font=defFont,dx=-4,dy=-4),genTxt(txt="↓",size=4,font=symFont,dx=-4,dy=4)]),
genIsland(w=19,kw=16,d=19,kd=16,txt=[genTxt(txt="3",size=4,font=defFont,dx=-4,dy=-4),genTxt(txt="PgDn",size=4,font=defFont,dx=0,dy=3)]),
genIsland(w=19,kw=16,d=38,kd=35,txt=[genTxt(txt="Enter",size=4,font=defFont,dx=0,dy=-10)]),
]);


//row 6
s3r6=genRow(x=maxx(s2r6),y=maxy(s2r5),spec=[
genSpacer(w=1.75,d=19),
genIsland(w=38,kw=35,d=19,kd=16,txt=[genTxt(txt="0",size=4,font=defFont,dx=-13,dy=-4),genTxt(txt="Ins",size=4,font=defFont,dx=-10,dy=3)]),
genIsland(w=19,kw=16,d=19,kd=16,txt=[genTxt(txt=".",size=4,font=defFont,dx=-4,dy=-4),genTxt(txt="Del",size=4,font=defFont,dx=-2,dy=3)]),
]);


//complete middle section
section3 = concat(s3r1,s3r2,s3r3,s3r4,s3r5,s3r6);









