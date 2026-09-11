wireDia=0.645; //diameter of wire used for crosspoint base and tactile domes
fnt="Arial Rounded MT Bold:style=Regular"; //default font

//base types
CROSSPOINT=0; //base uses 2 bare wires to make contact
TACTILE6MM=1; //base uses a 6mm tactile switch 
TACTILE12MM=2; //base uses a 12mm tactile switch
DOME12MM=3; //base uses a 12mm circular tactile dome
DOMEGX12900=4; //base uses a Snaptron GX12900 dome
DOME5176=5; //base uses a Keystone 5176 dome
baseOffsets=[6,8.7,9.7,6,6]; //base offsets for generating assembled model
baseType=undef; //override to specify base type
defBaseType=(baseType==undef)?TACTILE6MM:baseType;



//======= main modules ==============

//generates a single key island
//x - left edge
//y - top edge
//w - width
//d - depth
//kw - key width
//kd - key depth
//txt - a collection of 0 or more text or svg items
//spx - if true, add 2 extra springs (e.g. for spacebar)
//sps - spacing of extra springs from center
function genIsland(x=0,y=0,w=19,d=19,kw=16,kd=16,txt=[genTxt()],spx=false,sps=0)
= [x,y,w,d,kw,kd,txt,spx,sps];

//generates a blank island with no key
//x - left edge
//y - top edge
//w - width
//d - depth
function genSpacer(x=0,y=0,w=19,d=19)
= [x,y,w,d,0,0,[],false,0];

//generates 1 text item
//txt - text
//font - font
//size - text size
//dx - left/right offset in mm
//dy - up/down offset in mm
function genTxt(txt="ANY",font=fnt,size=4.5,dx=0,dy=0)
= [txt,font,size,dx,dy];

//generates 1 svg item
//file - filename of svg
//size - image size
//dx - left/right offset in mm
//dy - up/down offset in mm
function genSvg(file="",size=6,dx=0,dy=0)
= ["SVG",file,size,dx,dy];



//========= convenience functions ==============

//get the minimum X value for a collection of islands
function minx(spec,m=9999999,i=0) =
  (i==len(spec))?m:(m<spec[i][0])?minx(spec,m,i+1):minx(spec,spec[i][0],i+1);
//get the minimum Y value for a collection of islands
function miny(spec,m=9999999,i=0) =
  (i==len(spec))?m:(m<spec[i][1])?miny(spec,m,i+1):miny(spec,spec[i][1],i+1);
//get the maximum X value for a collection of islands
function maxx(spec,m=-9999999,i=0) =
  (i==len(spec))?m:(m>(spec[i][0]+spec[i][2]))?maxx(spec,m,i+1):maxx(spec,(spec[i][0]+spec[i][2]),i+1);
//get the maximum Y value for a collection of islands
function maxy(spec,m=-9999999,i=0) =
  (i==len(spec))?m:(m>(spec[i][1]+spec[i][3]))?maxy(spec,m,i+1):maxy(spec,(spec[i][1]+spec[i][3]),i+1);
  

//starting at (x,y), set the x and y values of each island so that they create a contiguous row
function genRow(spec,x=0,y=0,newSpec=[],index=0)=((index==len(spec))?newSpec:genRow(spec=spec,x=x+spec[index][2],y=y,newSpec=concat(newSpec,[setXY(spec[index],x,y)]),index=index+1));

//starting at (x,y), set the x and y values of each island so that they create a contiguous column
function genColumn(spec,x=0,y=0,newSpec=[],index=0)=((index==len(spec))?newSpec:genColumn(spec=spec,x=x,y=y+spec[index][3],newSpec=concat(newSpec,[setXY(spec[index],x,y)]),index=index+1));











//renders a single key spring 
//width,depth,height,thickness,actuator height, spring width, wall
module keySpring(w=19,d=19,h=4,th=.6,ah=2.3,spw=3,wl=1,spx=false,sps=0,fill=true)
{
  union()
  {
    //border
    difference()
    {
      translate([-w/2,-d/2,0])
      cube([w,d,h]);
      translate([-w/2+wl,-d/2+wl,-h/2])
      cube([w-wl*2,d-wl*2,h*2]);
      for(o=[0:wireDia*8:floor((w-wireDia*5)/2)])
      {
        translate([-wireDia*2+o,-d*2,wireDia*4])
        cube([wireDia*4,d*4,wireDia*4]);
        translate([-wireDia*2-o,-d*2,wireDia*4])
        cube([wireDia*4,d*4,wireDia*4]);
      }
      translate([-w*2,-wireDia*2,h-wireDia*2])
      cube([w*4,wireDia*4,wireDia*4]);
    }
    //actual spring
    if(fill)
    {
      cylinder(d=spw*sqrt(2),h=ah,$fn=20);
      translate([-w/2,-spw/2,0])
      cube([w,spw,th]);
      translate([-spw/2,-d/2,0])
      cube([spw,d,th]);
      if(spx)
      {
        translate([sps-spw/2,-d/2,0])
        cube([spw,d,th]);
        translate([-sps-spw/2,-d/2,0])
        cube([spw,d,th]);
      }
    }
  }
}

//renders a single key
//width, depth, thickness, radius,post width, post height, notch height, spring wisth, text(text, font, size, x, y)
module key(w=16,d=16,th=2,r=2,pw=7,ph=3,nh=.9,spw=3,txt=[["ANY","",8,0,0]],spx=false,sps=0)
{
  nw=spw;
  difference()
  {
    union()
    {
      //key cap
      hull()
      {
        translate([(w/2-r),(d/2-r),th/2])
        intersection()
        {
          sphere(r=r,$fn=60);
          cube([w,w,th],center=true);
        }
        translate([(w/2-r),-(d/2-r),th/2])
        intersection()
        {
          sphere(r=r,$fn=60);
          cube([w,w,th],center=true);
        }
        translate([-(w/2-r),(d/2-r),th/2])
        intersection()
        {
          sphere(r=r,$fn=60);
          cube([w,w,th],center=true);
        }
        translate([-(w/2-r),-(d/2-r),th/2])
        intersection()
        {
          sphere(r=r,$fn=60);
          cube([w,w,th],center=true);
        }
      }
      //post(s)
      translate([-pw/2,-pw/2,0])
      cube([pw,pw,ph+th]);
      if(spx)
      {
        translate([sps-pw/2,-pw/2,0])
        cube([pw,pw,ph+th]);
        translate([-sps-pw/2,-pw/2,0])
        cube([pw,pw,ph+th]);
      }
    }
    //key text / svg
    for(i=[0:len(txt)-1])
    {
      translate([-txt[i][3],-txt[i][4],-.2])
      mirror([1,0,0])
      linear_extrude(.6)
      if(txt[i][0]=="SVG")
      {
        resize([txt[i][2],txt[i][2]])
        import(txt[i][1],center=true);
      }
      else
      {
        text(txt[i][0],font=txt[i][1],size=txt[i][2],valign="center",halign="center");
      }
    }
    //spring cuts on post
    translate([-nw/2,-w/2,th+ph-nh])
    cube([nw,w,ph*2]);
    if(spx)
    {
      translate([sps-nw/2,-w/2,th+ph-nh])
      cube([nw,w,ph*2]);
      translate([-sps-nw/2,-w/2,th+ph-nh])
      cube([nw,w,ph*2]);
    }
    translate([-w/2,-nw/2,th+ph-nh])
    cube([w,nw,ph*2]);
  }
}

//base for a single key (crosspoint base)
//width,depth,thickness,springwidth,springlength,springthickness
module keyBase(w=19,d=19,th=2,spw=1,spl=10,spth=.4,wl=1,fill=true)
{
  ywel=th+wireDia*1.5;
  union()
  {

    //body
    translate([-w/2,-d/2,0])
    cube([w,d,th]);
    translate([-(w/2-wl),-(d/2-wl),0])
    cube([wl*2,wl*2,ywel]);
    translate([-(w/2-wl),(d/2-wl*3),0])
    cube([wl*2,wl*2,ywel]);
    translate([(w/2-wl*3),-(d/2-wl),0])
    cube([wl*2,wl*2,ywel]);
    translate([(w/2-wl*3),(d/2-wl*3),0])
    cube([wl*2,wl*2,ywel]);
    if(fill)
    {
      //y bridges
      difference()
      {
        union()
        {
          hull()
          {
            translate([-spl/2,(spw+wireDia*.5),0])
            cylinder(d=spw*2,h=ywel,$fn=30);
            translate([-spl/2,-(spw+wireDia*.5),0])
            cylinder(d=spw*2,h=ywel,$fn=30);
          }
          hull()
          {
            translate([spl/2,-(spw+wireDia*.5),0])
            cylinder(d=spw*2,h=ywel,$fn=30);
            translate([spl/2,(spw+wireDia*.5),0])
            cylinder(d=spw*2,h=ywel,$fn=30);
          }
        }
        cube([w*2,wireDia,100],center=true);

      }
      hull()
      {
        translate([spl/2,(spw*.75+wireDia*.5),ywel-spth])
        cylinder(d=spw,h=spth,$fn=10);
        translate([-spl/2,(spw*.75+wireDia*.5),ywel-spth])
        cylinder(d=spw,h=spth,$fn=10);
      }
      hull()
      {
        translate([spl/2,-(spw*.75+wireDia*.5),ywel-spth])
        cylinder(d=spw,h=spth,$fn=10);
        translate([-spl/2,-(spw/2+wireDia*.5),ywel-spth])
        cylinder(d=spw,h=spth,$fn=10);
      }
    
      difference()
      {
        translate([-wireDia*7.5,spw+wireDia*4,0])
        cube([wireDia*15,wireDia*4,ywel+wireDia*2]);
        cube([wireDia,w*2,100],center=true);
      }
      mirror([0,1,0])
      difference()
      {
        translate([-wireDia*7.5,spw+wireDia*4,0])
        cube([wireDia*15,wireDia*4,ywel+wireDia*2]);
        cube([wireDia,w*2,100],center=true);
      }
    }
  }
}

//base for 1 key (tactile switches)
//width,depth,thickness,wall
module keyBaseBtn(w=19,d=19,th=1,wl=1,bw=6,bh=4.3,lp=5,fill=true)
{
  c1=0;
  c2=0;
  difference()
  {
    //body
    union()
    {
      translate([-w/2,-d/2,0])
      cube([w,d,th+bh-1.3]);
      translate([-w/2+wl+c1,-d/2+wl+c1,0])
      cube([w-wl*2-c1*2,d-wl*2-c1*2,th+bh-.3]);
    }
    if(fill)
    {
      //switch pocket
      translate([-bw/2-c2,-bw/2-c2,th])
      cube([bw+c2*2,bw+c2*2,100]);
      //interior
      translate([-w/2+wl*2,-d/2+wl*2,th+2])
      cube([w-wl*4,d-wl*4,100]);
      //lead holes
      for(x=[0:1])
      {
        for(y=[0:1])
        {
          mirror([0,y,0])
          mirror([x,0,0])
          translate([-lp/2,-bw/2,-1])
          cylinder(d=3,h=100,$fn=20);
        }
      }
    }
    else
    {
      //interior
      translate([-w/2+wl*2,-d/2+wl*2,th])
      cube([w-wl*4,d-wl*4,100]);
    }
  }

}

//base for 1 key (tactile domes)
//width,depth,thickness,wall
module keyBaseDome(w=19,d=19,th=1,wl=1,dw=12,dh=.65,pz=0,fill=true,cross=false)
{
  del=th+2.7-dh;
  radius=(dw^2/8/dh)+dh/2;
  c1=0;
  c2=0.5;
  difference()
  {
    //body
    union()
    {
      translate([-w/2,-d/2,0])
      cube([w,d,th+1]);
      translate([-w/2+wl+c1,-d/2+wl+c1,0])
      cube([w-wl*2-c1*2,d-wl*2-c1*2,del+dh/2]);
    }
    if(fill)
    {
      //dome pocket
      translate([0,0,del])
      difference()
      {
        cylinder(d=dw+c2*2,h=20,$fn=30);
        if(cross)
        {
          for(x=[0:1])
          {
            for(y=[0:1])
            {
              mirror([x,0,0])
              mirror([0,y,0])
              translate([dw*.62,dw*.62,-1])
              cylinder(d=dw,h=30,$fn=30);
            }
          }
        }
      }
      translate([0,0,th])
      difference()
      {
        cylinder(d=dw-c2*2,h=20,$fn=30);
        if(cross)
        {
          for(x=[0:1])
          {
            for(y=[0:1])
            {
              mirror([x,0,0])
              mirror([0,y,0])
              translate([dw*.62,dw*.62,-1])
              cylinder(d=dw,h=30,$fn=30);
            }
          }
        }
      }
      //y wire cuts
      translate([-wireDia+dw/2,-w,del-wireDia*.8])
      cube([wireDia,w*2,20]);
      translate([-dw/2,-w,del-wireDia*.8])
      cube([wireDia,w*2,20]);
      translate([-wireDia+dw/2,-w-w/4,th])
      cube([wireDia,w,20]);
      translate([-dw/2,-w-w/4,th])
      cube([wireDia,w,20]);
      translate([-wireDia+dw/2,w/4,th])
      cube([wireDia,w,20]);
      translate([-dw/2,w/4,th])
      cube([wireDia,w,20]);
      //x wire cut
      translate([-w,-wireDia/2,th])
      cube([w*2,wireDia,20]);
      //side cutouts
      translate([-dw/2,dw/4+d/4,th])
      cube([dw,w,20]);
      mirror([0,1,0])
      translate([-dw/2,dw/4+d/4,th])
      cube([dw,w,20]);
    }
    else
    {
      //interior
      translate([-w/2+wl*2,-d/2+wl*2,th])
      cube([w-wl*4,d-wl*4,100]);
      if(w>wl*8)
      {
        translate([0,0,50+th+wireDia])
        cube([w-wl*8,d*2,100],center=true);
      }
      if(d>wl*8)
      {
        translate([0,0,50+th+wireDia])
        cube([w*2,d-wl*8,100],center=true);
      }
    }
  }
  if(fill)
  {
    //center post
    difference()
    {
      cylinder(d=max(dw/4,wireDia*4),h=(del-wireDia/2+pz),$fn=20);
      translate([0,0,del-wireDia/2+pz])
      rotate([0,90,0])
      cube([wireDia,wireDia,w],center=true);
    }
  }
}

//key cap surround for 1 key
//width,depth,key width, key depth, thickness, radius, clearance
module keyCover(w=19,d=19,kw=16,kd=16,th=3,r=2,cl=.75,wl=1,spw=3)
{
  cwl=(w-kw)/2-cl;
  difference()
  {
    union()
    {
      translate([-w/2,-d/2,0])
      cube([w,d,th]);
    }
    if(kw>0 && kd>0)
    {
      hull()
      {
        translate([(kw/2-r),(kd/2-r),0])
        cylinder(r=r+cl,h=th*4,center=true,$fn=40);
        translate([(kw/2-r),-(kd/2-r),0])
        cylinder(r=r+cl,h=th*4,center=true,$fn=40);
        translate([-(kw/2-r),(kd/2-r),0])
        cylinder(r=r+cl,h=th*4,center=true,$fn=40);
        translate([-(kw/2-r),-(kd/2-r),0])
        cylinder(r=r+cl,h=th*4,center=true,$fn=40);
      }
    }
  }

}


//spec: [island,island,island...]
//island: [x,y,w,d,kw,kd,txt,spx,sps]
//txt: [[text,font,size,dx,dy],...]

//render an array of spring islands
module springs(spec)
{
  //keySpring(w=19,d=19,h=4,th=.6, ah=2.3,spw=3,wl=1,spx=false,sps=0)
  for(island=spec)
  {
    translate([-island[0]-island[2]/2,-island[1]-island[3]/2,0])
    keySpring(w=island[2],d=island[3],spx=island[7],sps=island[8],fill=island[4]>0&&island[5]>0);
  }
}

//render an array of base islands (crosspoint)
module base(spec)
{
  //(w=19,d=19,th=2,spw=2,spl=10,spth=.4)
  for(island=spec)
  {
    translate([island[0]+island[2]/2,-island[1]-island[3]/2,0])
    if(defBaseType==CROSSPOINT)
    {
      keyBase(w=island[2],d=island[3],fill=island[4]>0&&island[5]>0);
    }
    else if(defBaseType==TACTILE6MM)
    {
      keyBaseBtn(w=island[2],d=island[3],bw=6,bh=5,lp=5,fill=island[4]>0&&island[5]>0);
    }
    else if(defBaseType==TACTILE12MM)
    {
      keyBaseBtn(w=island[2],d=island[3],bw=12,bh=6,lp=5,fill=island[4]>0&&island[5]>0);
    }
    else if(defBaseType==DOME12MM)
    {
      keyBaseDome(w=island[2],d=island[3],fill=island[4]>0&&island[5]>0);
    }
    else if(defBaseType==DOMEGX12900)
    {
      keyBaseDome(w=island[2],d=island[3],dw=12,dh=.6,pz=-.1,fill=island[4]>0&&island[5]>0,cross=true);
    }
    else if(defBaseType==DOME5176)
    {
      keyBaseDome(w=island[2],d=island[3],dw=12,dh=.7,pz=-.2,fill=island[4]>0&&island[5]>0,cross=true);
    }
  }
}


//render an array of key covers
module cover(spec)
{
  //keyCover(w=19,d=19,kw=16,kd=16, th=3,r=2,cl=.75)
  for(island=spec)
  {
    //key(w=16,d=16,th=2,r=2,pw=7,ph=3,nh=.9,spw=3 ,txt=[["W","",8,0,0]],spx=false,sps=0)
    translate([island[0]+island[2]/2,-island[1]-island[3]/2,0])
    keyCover(w=island[2],d=island[3],kw=island[4],kd=island[5]);
  }
}

//render an array of keys
module keys(spec)
{
  for(island=spec)
  {
    //key(w=16,d=16,th=2,r=2,pw=7,ph=3,nh=.9,spw=3 ,txt=[["W","",8,0,0]],spx=false,sps=0)
    if(island[4]>0&&island[5]>0)
    {
      translate([-island[0]-island[2]/2,-island[1]-island[3]/2,0])
      key(w=island[4],d=island[5],txt=island[6],spx=island[7],sps=island[8]);
    }
  }
}



//render assembled keyboard
module assembled(spec=[],expld=0)
{

  translate([0,0,baseOffsets[defBaseType]+4+60*expld])
  rotate([0,180,0])
  keys(spec);

  color("#b0b0b0")
  translate([0,0,baseOffsets[defBaseType]+40*expld])
  cover(spec);

  color("#303030")
  translate([0,0,baseOffsets[defBaseType]+20*expld])
  rotate([0,180,0])
  springs(spec);

  color("#808080")
  base(spec);
}

//island: [x,y,w,d,kw,kd,txt,spx,sps]
//return a copy of island with x and y set
function setXY(island,x,y) = [x,y,for(i=[2:len(island)-1])island[i]];



