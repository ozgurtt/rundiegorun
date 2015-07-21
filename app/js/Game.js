define([
  'phaser',
], function (phaser) {

  //////
  ///ELEMENTS DESCRIPTION
  // Blocks: physics elements where the player is able to walk and jump. No damage is caused on collapsing  //
  // Obstacles: physics elements that cause a drop of energy on collapsing  //
  // this.backgroundGroup: group of sprites, objects and geometric objects that compose the game background. //
  //////

  var GameState = function (game) {};

  GameState.prototype = {
    constructor: GameState,
    preload: function() {
      this.game.time.advancedTiming = true;
      this.confObstacles = {minobstacleInterval: 2500, maxobstacleInterval: 4500};
      this.confBlocks = {minobstacleInterval: 6000, maxobstacleInterval: 12000};
      this.confTargets = {minobstacleInterval: 6000, maxobstacleInterval: 12000};

      // Background Group - Controles z-indexing as well
      this.backgroundGroup = this.game.add.group();

      // Ground Groups - Controles z-indexing as well
      this.groundGroup = this.game.add.group();

      // Damaging Group - Controles z-indexing as well
      this.damagingGroup = this.game.add.group();

      // Target group - Controles z-Index as well
      this.targetGroup = this.game.add.group();

      // Jump & Dock Timer Control
      this.jumperTime = 0;
    },
    createWorld: function(){

      // Create the Sky gradient
      this.skybackground = this.game.add.bitmapData(640, 320);
      var grd = this.skybackground.context.createLinearGradient(0,0,0,320);

      grd.addColorStop(0,"#0a68b0");
      grd.addColorStop(1,"white");

      this.skybackground.context.fillStyle = grd;
      this.skybackground.context.fillRect(0, 0, 640, 320);
      this.backgroundGroup.add(this.game.add.sprite(0, 0, this.skybackground));

      // City Background Parallax & Ground sprite
      this.backgroundCity = this.game.add.tileSprite(0, 20, 1764,  400, 'background-city');
      this.backgroundCity.scale.set(0.65, 0.65);
      this.backgroundCity.fixedToCamera = true;
      this.backgroundGroup.add(this.backgroundCity);

      this.backgroundForest = this.game.add.tileSprite(0, 142, 1116,  148, 'background-forest');
      this.backgroundForest.fixedToCamera = true;
      this.backgroundGroup.add(this.backgroundForest);

      this.ground = this.game.add.tileSprite(0, 280, 640,  40, 'ground');
      this.ground.fixedToCamera = true;
      this.groundGroup.add(this.ground);
      // Physics enabled for ground to work as floor
      this.game.physics.arcade.enable(this.ground);
      this.ground.body.immovable = true;
      this.ground.body.collideWorldBounds = true;
      
      // Energy Bar & Bar Frame
      this.energyBar = this.game.add.graphics(10, 10);
      this.energyBar.beginFill(0xCC433C, 1);
      this.energyBar.drawRect(0, 0, 150, 20);
      this.energyBarFrame = this.game.add.sprite(10, 10, 'energy-bar');
      this.backgroundGroup.add(this.energyBar);
      this.backgroundGroup.add(this.energyBarFrame);
    },
    createEnegyLevel: function(){
      var text = 100;
      var style = { font: "12px Arial", fill: "#ffffff", align: "center" };

      this.energyBarText = this.game.add.text(75, 13, text, style);
    },
    createPlayer: function(){
      //create player
      this.player = this.game.add.sprite(150, 0, 'player');

      this.player.animations.add('run', [9, 10, 11, 12, 13, 14, 15, 16, 17], 15, true);
      this.player.animations.add('jump', [0, 1, 2, 3, 4, 5, 6, 7], 5, false);
      this.player.animations.add('dock', [19, 20, 21, 22, 23, 24], 15, true);

      this.player.standDimensions = {width: this.player.width, height: this.player.height};
      this.player.dockedDimensions = {width: this.player.standDimensions.width, height: this.player.standDimensions.height/2};
      this.game.camera.follow(this.player);
      this.player.anchor.setTo(1, 1);

      // Physics enabled to the player
      this.game.physics.arcade.enable(this.player);
      this.player.body.gravity.y = 1000;
    },
    createTargetsScore: function(){

      var initialX = 35;
      this.targetsScore = [];

      for(var i = 0; i < this.targets.length; i++){
        var index = this.targetsScore.push(this.game.add.sprite( ((this.game.width-initialX) - (initialX*i)), 10, this.targets[i].target.key, this.targets[i].target.frame))-1;
        this.targetsScore[index].scale.set(0.6, 0.6);
      }
    },
    targetsMove: function(){
      var cont = 0;
      do{
        var indexTarget = Math.floor(Math.random() * (this.targets.length));
        var timeInt = (Math.random() * (this.confTargets.maxobstacleInterval - this.confTargets.minobstacleInterval + 1)) + this.confTargets.minobstacleInterval;
        var positionY = (Math.random() * (240 - 160 + 1)) + 160;
        cont++;
      }while( this.targets[indexTarget].status === 'active' &&  cont < this.targets.length);

      var self = this;
      setTimeout(function(){
        if( typeof(self.targets[indexTarget]) != 'undefined' ){
          self.targets[indexTarget].status = 'active';
          if( self.targets[indexTarget].type === 'random' ){
            self.targets[indexTarget].target.y = positionY;
          }
          self.targetsMove();
        }
      }, timeInt);
    },
    createTargets: function(){
      this.targets = [];
      this.tagetsRandom = ['contract', 'diploma', 'passport'];

      for (var i = 0; i < this.tagetsRandom.length; i++) {
        var elIndex = this.targets.push({
                  target: this.game.add.sprite(this.game.width, 0, this.tagetsRandom[i]), 
                  status: 'noactive', 
                  type: 'random'
                }) - 1;
        this.targetGroup.add(this.targets[elIndex].target);
        this.targets[elIndex].target.name = 'target'+elIndex;
        // Enable collision on the obstacle  
        this.game.physics.arcade.enable(this.targets[elIndex].target);
      };
    },
    createBlocks: function(){

      this.blocks = [];

      this.blocksFixed = [{
                            block:'barrel', 
                            pos: 231, 
                            speed: 1.5
                          }];

      this.blocksPattern = [{
                            block:'block-wood', 
                            maxNum: 5,
                            speed: 1.5,
                            blockWidth: 40,
                            maxPos: 240,
                            minPos: 120
                          },
                          {
                            block:'block-wall', 
                            maxNum: 2,
                            speed: 1.5,
                            blockWidth: 40,
                            maxPos: 240,
                            minPos: 120
                          }];

      for (var i = 0; i < this.blocksPattern.length; i++){

        var numEl = Math.floor((Math.random() * (this.blocksPattern[i].maxNum)) + 1);
        var maxY = Math.floor((Math.random() * (this.blocksPattern[i].maxNum)) + 1);

        var elIndex = this.blocks.push({
          // X, Y, width, Height
          block: this.game.add.tileSprite( this.game.width, 0, (this.blocksPattern[i].blockWidth * numEl), this.blocksPattern[i].blockWidth, this.blocksPattern[i].block), 
          status: 'noactive', 
          type: 'pattern',
          speed: this.blocksPattern[i].speed,
          maxPos: this.blocksPattern[i].maxPos,
          minPos: this.blocksPattern[i].minPos
        })-1;
        this.groundGroup.add(this.blocks[elIndex].block);
        // Physics enabled for ground to work as floor
        this.game.physics.arcade.enable(this.blocks[elIndex].block);
        this.blocks[elIndex].block.body.immovable = true;
      };
      
      for (var i = 0; i < this.blocksFixed.length; i++) {

          this.blocksFixed[i];
          var elIndex = this.blocks.push({
            block: this.game.add.sprite(this.game.width, this.blocksFixed[i].pos, this.blocksFixed[i].block), 
            status: 'noactive', 
            pos: this.blocksFixed[i].pos, 
            type: 'fixed',
            speed: this.blocksFixed[i].speed
          })-1;

          this.groundGroup.add(this.blocks[elIndex].block);
          // Physics enabled for ground to work as floor
          this.game.physics.arcade.enable(this.blocks[elIndex].block);
          this.blocks[elIndex].block.body.immovable = true;
      };
    },
    blocksSetMovement: function(){
      var timeInt = (Math.random() * (this.confBlocks.maxobstacleInterval - this.confBlocks.minobstacleInterval + 1)) + this.confBlocks.minobstacleInterval;
      var indexBlock = Math.floor(Math.random() * (this.blocks.length));
      
      var self = this;

      setTimeout(function(){
        self.blocks[indexBlock].status = 'active';

        if( self.blocks[indexBlock].type === 'pattern' ){
          var posY = Math.floor(Math.random() * (self.blocks[indexBlock].maxPos - self.blocks[indexBlock].minPos + 1)) + self.blocks[indexBlock].minPos;
          self.blocks[indexBlock].block.y = posY;          
        }

        self.blocksSetMovement();
      }, timeInt);
    },
    createobstacles: function(){

      this.obstaclesRandom = ['suitcase', 'umbrella'];
      this.obstaclesFixedPos = [{
                                obstacle:'cactus', 
                                pos: 231, 
                                speed: 1.5
                              },
                              {
                                obstacle:'snail', 
                                pos: 242, 
                                speed: 1.5
                              }];

      this.obstaclesAnim = [{
                            obstacle:'sheep', 
                            pos: 237, 
                            speed: 2.7,
                            scale: 0.7,
                            animationName: 'animation',
                            animationFrame: [0, 1, 2],
                            animationSpeed: 7,
                            animationLoop: true,
                          }];
      this.obstacles = []

      for (var i = 0; i < this.obstaclesAnim.length; i++) {
        var elIndex = this.obstacles.push({obstacle: this.game.add.sprite(this.game.width, this.obstaclesAnim[i].pos, this.obstaclesAnim[i].obstacle), 
                          status: 'noactive', 
                          pos: this.obstaclesAnim[i].pos, 
                          type: 'animated',
                          speed: this.obstaclesAnim[i].speed
                        })-1;

        this.obstacles[elIndex].obstacle.scale.set(this.obstaclesAnim[elIndex].scale);
        this.obstacles[elIndex].obstacle.animations.add('animation', [0, 1, 2], this.obstaclesAnim[elIndex].animationSpeed, this.obstaclesAnim[elIndex].animationLoop);
        this.obstacles[elIndex].obstacle.animations.play('animation');
        this.damagingGroup.add(this.obstacles[elIndex].obstacle);
        // Enable collision on the obstacle  
        this.game.physics.arcade.enable(this.obstacles[elIndex].obstacle);
      };

      for (var i = 0; i < this.obstaclesRandom.length; i++) {
        var elIndex = this.obstacles.push({
                  obstacle: this.game.add.sprite(this.game.width, 0, this.obstaclesRandom[i]), 
                  status: 'noactive', 
                  type: 'random'
                }) - 1;
        this.damagingGroup.add(this.obstacles[elIndex].obstacle);
        // Enable collision on the obstacle  
        this.game.physics.arcade.enable(this.obstacles[elIndex].obstacle);
      };

      for (var i = 0; i < this.obstaclesFixedPos.length; i++) {
        var elIndex = this.obstacles.push({
                            obstacle: this.game.add.sprite(this.game.width, this.obstaclesFixedPos[i].pos, this.obstaclesFixedPos[i].obstacle), 
                            status: 'noactive', 
                            pos: this.obstaclesFixedPos[i].pos, 
                            type: 'fixed',
                            speed: this.obstaclesFixedPos[i].speed
                          }) - 1;
        this.damagingGroup.add(this.obstacles[elIndex].obstacle);
        // Enable collision on the obstacle  
        this.game.physics.arcade.enable(this.obstacles[elIndex].obstacle);
      };
    },
    obstaclesAssignProb: function(){

    },
    obstaclesSetTimeMove: function(){
      var cont = 0;
      do{
        var indexObstacle = Math.floor(Math.random() * (this.obstacles.length));  
        var timeInt = (Math.random() * (this.confObstacles.maxobstacleInterval - this.confObstacles.minobstacleInterval + 1)) + this.confObstacles.minobstacleInterval;
        var positionY = (Math.random() * (240 - 160 + 1)) + 160;
        cont++;
      }while( this.obstacles[indexObstacle].status === 'active' &&  cont < this.obstacles.length);

      var self = this;
      setTimeout(function(){
        self.obstacles[indexObstacle].status = 'active';
        if( self.obstacles[indexObstacle].type === 'random' ){
          self.obstacles[indexObstacle].obstacle.y = positionY;
        }
        self.obstaclesSetTimeMove();
      }, timeInt);
    },
    create: function() {

      this.createWorld();
      this.createEnegyLevel();
      this.createobstacles();
      this.createBlocks();
      this.createTargets();
      this.createTargetsScore();
      this.createPlayer();

      // Starts moving the obstacles
      this.obstaclesSetTimeMove();

      // Starts moving the blocks
      this.blocksSetMovement();

      // Starts moving the targets
      this.targetsMove();

      // Enables Cursor control for the player
      this.cursors = this.game.input.keyboard.createCursorKeys();
    },
    render: function(){
      /*this.game.debug.text(this.game.time.fps || '--', 20, 70, "#00ff00", "40px Courier");  
      this.game.debug.bodyInfo(this.player, 0, 80);  */
    },
    playerRunning: function(){ 
      if( this.playerStatus !== 'running' &&  (!this.cursors.down.isDown) ){ console.log('running');
        this.player.animations.stop('jump');
        this.player.animations.stop('dock');
        this.player.animations.play('run');
        this.player.body.setSize(this.player.standDimensions.width, this.player.standDimensions.height);

        this.playerStatus = 'running';
      }
    },
    playerdock: function(){
      if( this.playerStatus !== 'docking' && this.playerStatus !== 'jumping' ){ console.log('docking');
        this.player.animations.stop('run');
        this.player.animations.stop('jump');
        this.player.animations.play('dock');
        this.player.body.setSize(this.player.dockedDimensions.width, this.player.dockedDimensions.height);

        this.playerStatus = 'docking';
      }
    },
    playerJump: function(){
      if( this.playerStatus !== 'jumping' && this.playerStatus !== 'docking' && this.game.time.now > this.jumperTime ){ console.log('jumping');
        this.player.animations.stop('run');
        this.player.animations.stop('dock');
        this.player.animations.play('jump');
        this.jumperTime = this.game.time.now + 440;
        this.player.body.velocity.y -= 560;

        this.playerStatus = 'jumping';
      }
    },
    playerHurted: function(){
      this.energyBarText.text -= 1;
      this.energyBar.scale.x = (this.energyBarText.text/100);
    },
    endOfGame: function(){
      // TODO: clear timeIntervals
    },
    playerHitTarget: function(player, target){
      for (var i = 0; i < this.targetsScore.length; i++) {
        if(this.targetsScore[i].key === target.key){
          this.game.add.sprite(this.targetsScore[i].x, this.targetsScore[i].y, 'check');
          break;
        }
      };

      // Remove it from the targets list so it wont be displayed again

      for (var i = 0; i < this.targets.length; i++) {
        if(this.targets[i].target.key === target.key){
          this.targets[i].target.destroy();
          this.targets.splice(i, 1);
          break;
        }
      };
    },
    update: function() {
      this.game.physics.arcade.collide(this.player, this.groundGroup, this.playerRunning, null, this);
      this.game.physics.arcade.overlap(this.player, this.damagingGroup, this.playerHurted, null, this);
      this.game.physics.arcade.overlap(this.player, this.targetGroup, this.playerHitTarget, this.tmp, this);

      // Jump Detection & dock detection
      if(this.cursors.up.isDown) {
        this.playerJump();
      }else if(this.cursors.down.isDown){
        this.playerdock();
      }

      this.ground.tilePosition.x -= 1.5;
      this.backgroundCity.tilePosition.x -= 0.1;
      this.backgroundForest.tilePosition.x -= 0.2;

      // If energy is over
      if(this.energyBarText.text <= 0) {
        // this.game.state.start('Game');
      }

      /*if(this.blockWood.x < -this.blockWood.width) {
        this.blockWood.body.x = this.game.width;
      }*/

      // Move Active Blocks
      for (var i = 0; i < this.blocks.length; i++) {
        if( this.blocks[i].status === 'active' ){
          this.blocks[i].block.x -= this.blocks[i].speed;
        }

        if(this.blocks[i].block.x < -this.blocks[i].block.width) {
          this.blocks[i].status = 'noactive';
          this.blocks[i].block.x = this.game.width;
        }
      };

      // Move Active obstacles
      for (var i = 0; i < this.obstacles.length; i++) {
        if( this.obstacles[i].status === 'active' ){

          if( this.obstacles[i].type === 'fixed' ){
            this.obstacles[i].obstacle.x -= this.obstacles[i].speed;
          }else if( this.obstacles[i].type === 'animated' ){
            this.obstacles[i].obstacle.x -= this.obstacles[i].speed;
          }else{
            this.obstacles[i].obstacle.x -= 3.5;
          }
        }

        if(this.obstacles[i].obstacle.x < -40) {
          this.obstacles[i].status = 'noactive';
          this.obstacles[i].obstacle.x = this.game.width;
        }
      };

      // Move Active Targets
      for (var i = 0; i < this.targets.length; i++) {
        if( this.targets[i].status === 'active' ){

          if( this.targets[i].type === 'fixed' ){
            this.targets[i].target.x -= this.targets[i].speed;
          }else if( this.targets[i].type === 'animated' ){ //console.log('animated');
            this.targets[i].target.x -= this.targets[i].speed;
          }else{
            this.targets[i].target.x -= 3;
          }
        }

        if( this.targets[i].target.x < -(40)) {
          this.targets[i].status = 'noactive';
          this.targets[i].target.x = this.game.width;
        }
      };
    }
  };

  return GameState;
});