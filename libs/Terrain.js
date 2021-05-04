var decoScene;
var decoScene2;
var sand;
var terrainScene;

export var coordX = new Array();
export var coordY = new Array();
export var coordZ = new Array();


function applySmoothing(o) {
  var m = terrainScene.children[0];
  THREE.Terrain.Normalize(m, o);
}

function buildTree() {
  var material = [
    new THREE.MeshLambertMaterial({ map: THREE.ImageUtils.loadTexture('img/treeBark.png') }), // brown stump
    new THREE.MeshLambertMaterial({ map: THREE.ImageUtils.loadTexture('img/treeLeaves2.png') }), // green leaves
  ];

  var c0 = new THREE.Mesh(new THREE.CylinderGeometry(5, 5, 110, 6, 1, true));
  c0.position.y = 55;
  var c1 = new THREE.Mesh(new THREE.CylinderGeometry(0, 30, 39, 8));
  c1.position.y = 70;
  var c2 = new THREE.Mesh(new THREE.CylinderGeometry(0, 29, 38, 8));
  c2.position.y = 85;
  var c3 = new THREE.Mesh(new THREE.CylinderGeometry(0, 28, 37, 8));
  c3.position.y = 100;

  var g = new THREE.Geometry();
  c0.updateMatrix();
  c1.updateMatrix();
  c2.updateMatrix();
  c3.updateMatrix();
  g.merge(c0.geometry, c0.matrix);
  g.merge(c1.geometry, c1.matrix);
  g.merge(c2.geometry, c2.matrix);
  g.merge(c3.geometry, c3.matrix);

  var b = c0.geometry.faces.length;
  for (var i = 0; i < g.faces.length; i++) {
    if (i < b) {
      g.faces[i].materialIndex = 0;
    } else {
      g.faces[i].materialIndex = 1;
    }
  }

  var m = new THREE.Mesh(g, material);

  m.scale.y = 1.25;
  return m;
}

/**
 * 
 * @param {*} size The size of the rock
 * @param {*} rockT The type of rock
 * @param {*} shape The shape of the rock
 * @returns  The mesh of the object
 */
function makeRock(size,rockT,shape){

  //setting the color
  var color2;
  var rockType;
  if(rockT==1){
      rockType='img/redRock2.png';
  }else if(rockT==2){
      rockType='img/rock5.jpg';
  }else if(rockT==3){
    rockType='img/rockP2.jpg';
  }

  //choose the shape
   let geometry;
  if(shape ==1){
    //
       geometry = new THREE.DodecahedronGeometry(size); // width, height, depth
  }else if(shape==2){
      geometry = new THREE.IcosahedronGeometry(size, size); // width, height, depth
  }else if(shape==3){
      geometry = new THREE.SphereGeometry(size, size, size); // width, height, depth
  }else if(shape ==4){
    geometry =new THREE.TetrahedronGeometry(size, 5);
  }
  //add texture and mesh;
   let loader = new THREE.TextureLoader();
  let texture = new THREE.MeshBasicMaterial({
      map: loader.load(rockType),
    });
 
  
 let mesh = new THREE.Mesh(geometry, texture);

  return mesh;
}


function buildTree2() {
  var material = [
    new THREE.MeshLambertMaterial({ map: THREE.ImageUtils.loadTexture('img/treeBark.png') }),
    new THREE.MeshLambertMaterial({ map: THREE.ImageUtils.loadTexture('img/treeLeaves.jpg') }), 
  ];

  var c0 = new THREE.Mesh(new THREE.CylinderGeometry(6.5, 6.5, 140, 6, 1, true));
  c0.position.y = 70;
  var c1 = new THREE.Mesh(new THREE.SphereGeometry(65, 4, 4));
  c1.position.y = 130;

  var g = new THREE.Geometry();
  c0.updateMatrix();
  c1.updateMatrix();
  g.merge(c0.geometry, c0.matrix);
  g.merge(c1.geometry, c1.matrix);

  var b = c0.geometry.faces.length;
  for (var i = 0; i < g.faces.length; i++) {
    if (i < b) {
      g.faces[i].materialIndex = 0;
    } else {
      g.faces[i].materialIndex = 1;
    }
  }

  var m = new THREE.Mesh(g, material);

  m.scale.y = 1.25;
  return m;
}

export class Terrain {
  isLoading = true;

  constructor(scene, waterLevel, terrainMinHeight, terrainMaxHeight, useFPS) {
    var that = this;
    var blend;
    var loader = new THREE.TextureLoader();
    loader.load('img/sand1.jpg', function (t1) {
      sand = new THREE.Mesh(
        new THREE.PlaneBufferGeometry(16500 , 16500 , 64, 64),
        new THREE.MeshLambertMaterial({ map: t1 })
      );
      sand.position.y = -100;
      sand.rotation.x = -0.5 * Math.PI;
      scene.add(sand);
      loader.load('img/grass1.jpg', function (grass) {
        loader.load('img/stone1.jpg', function (stone) {
          loader.load('img/snow1.jpg', function (snow) {
            blend = THREE.Terrain.generateBlendedMaterial([//Where each terrain texture should load
              { texture: t1 },
              { texture: grass, levels: [-80, -35, 20, 50] },
              { texture: stone, levels: [20, 50, 60, 85] },
              { texture: snow, glsl: '1.0 - smoothstep(65.0 + smoothstep(-256.0, 256.0, vPosition.x) * 10.0, 80.0, vPosition.z)' },
              { texture: stone, glsl: 'slope > 0.8 ? 0.2 : 1.0 - smoothstep(0.5, 0.8, slope) + 0.2' },
            ]);
            that.Regenerate();
          });
        });
      });
    });
    this.easing = 'Linear';
    this.heightmap = 'PerlinDiamond';
    this.maxHeight = terrainMaxHeight; /**Change to increase or decrease the maximum height of mountains */
    this.segments = 80;
    this.steps = 1;
    this.size = 5024; /**Size of the terrain plane. (width * length). Increase to scale-up the terrain. */
    this.sky = true;
    this.texture = 'Blended';
    this['width:length ratio'] = 1.0;
    this['Flight mode'] = useFPS;
    this.spread = 60;
    this.Regenerate = function () {
      var tree = parseInt(that.segments, 10),
        h = that.heightmap === 'heightmap.png';
      var terrain = {
        easing: THREE.Terrain[that.easing],
        heightmap: h ? heightmapImage : (that.heightmap = THREE.Terrain[that.heightmap]),
        material: that.texture == 'Wireframe' ? material : (that.texture == 'Blended' ? blend : gray),
        maxHeight: that.maxHeight,
        minHeight: terrainMinHeight, /**Depth of the terrain (More ditches), Make sure sand.position.y < minHeight*/
        steps: that.steps,
        stretch: true,
        useBufferGeometry: false,
        xSize: that.size,
        ySize: Math.round(that.size * that['width:length ratio']),
        xSegments: tree,
        ySegments: Math.round(tree * that['width:length ratio']),
        waterLevel: waterLevel,
        _mesh: typeof terrainScene === 'undefined' ? null : terrainScene.children[0],
      };
      scene.remove(terrainScene);
      terrainScene = THREE.Terrain(terrain);

      /**Prints coordinates of the vertices of the terrain */
      for (var i = 0; i < terrainScene.children[0].geometry.vertices.length; i++) {
        //console.log(terrainScene.children[0].geometry.vertices[i]);
        coordX[i] = Math.round(terrainScene.children[0].geometry.vertices[i].x);
        coordY[i] = Math.round(terrainScene.children[0].geometry.vertices[i].y);
        coordZ[i] = Math.round(terrainScene.children[0].geometry.vertices[i].z);
      }

      applySmoothing(terrain);
      scene.add(terrainScene);
      var he = document.getElementById('heightmap');
      if (he) {
        o.heightmap = he;
        THREE.Terrain.toHeightmap(terrainScene.children[0].geometry.vertices, o);
      }
      that['Scatter meshes']();
      that['Scatter meshes0']();
      that['Scatter meshes 2']();
      //that['Function name'](); //Add a new function that scatters your new mesh into the terrain scene
    };

    var rock = makeRock(20,1,1);
    this['Scatter meshes0'] = function () {
      var s = parseInt(that.segments, 10);
      var geo = terrainScene.children[0].geometry;
      terrainScene.remove(decoScene);
      decoScene = THREE.Terrain.ScatterMeshes(geo, {
        mesh: rock,
        w: s,
        spread:0.01,
        h: Math.round(s * that['width:length ratio']),
        maxSlope: 1.0,
        maxTilt: 0.0, // Tilt of tree position
        waterLevel: waterLevel,
      });
      terrainScene.add(decoScene);
      that.isLoading = false;
    };

    var mesh = buildTree(); //Make another variable that stores a new mesh and then make another function scatter the new mesh
    this['Scatter meshes'] = function () {
      var s = parseInt(that.segments, 10);
      var geo = terrainScene.children[0].geometry;
      terrainScene.remove(decoScene);
      decoScene = THREE.Terrain.ScatterMeshes(geo, {
        mesh: mesh,
        w: s,
        h: Math.round(s * that['width:length ratio']),
        maxSlope: 0.5,
        maxTilt: 0.1, // Tilt of tree position
        waterLevel: waterLevel,
      });
      terrainScene.add(decoScene);
      that.isLoading = false;
    };

    var mesh2 = buildTree2(); //Make another variable that stores a new mesh and then make another function scatter the new mesh
    this['Scatter meshes 2'] = function () {
      var s = parseInt(that.segments, 10);
      var geo = terrainScene.children[0].geometry;
      terrainScene.remove(decoScene2);
      decoScene2 = THREE.Terrain.ScatterMeshes(geo, {
        mesh: mesh2,
        w: s,
        h: Math.round(s * that['width:length ratio']),
        maxSlope: 0.5,
        maxTilt: 0.1, // Tilt of tree position
        waterLevel: waterLevel,
      });
      terrainScene.add(decoScene2);
      that.isLoading = false;
    };
  }

  update(delta) {
    if (terrainScene) terrainScene.rotation.z = this.rotationZ;
  }
}