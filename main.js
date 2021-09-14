//config对象
//定义了一个config对象配置Phaser 游戏
var config = {
    type: Phaser.AUTO,              //渲染器
    width: 800,                     //画面尺寸
    height: 600,                    
    physics: {                      //要使用的物理引擎
        default: 'arcade',
        arcade: {
            gravity: { y: 300 },
            debug: false
        }
    },
    scene: {                        //默认的场景
        preload: preload,
        create: create,
        update: update
    }
};

var platforms;              //全局变量-平台
var player;                 //全局变量-角色
var stars;
var bombs;
var cursors;
var score = 0;              //全局变量-计分
var scoreText;              //全局变量-分数的文本内容
var gameOver = false;

//Phaser.Game实例
//定义了一个叫作game变量来指向一个Phaser.Game实例，
//而对象config作为参数传入到该实例中，
//现在我们就启动了一个进程，开启了Phaser的生命周期。
var game = new Phaser.Game(config);

//preload ()载入所需的资源
//我们只需要在场景函数preload中加入Phaser的载入代码即可，
//Phaser将自动调用该函数并执行里面的内容。
//这里载入4个图片和一个精灵表单。
//第一个参数是资源的名称,第二个参数是资源的路径
function preload (){
    this.load.image('sky', '../assets/sky.png');
    this.load.image('ground', '../assets/platform.png');
    this.load.image('star', '../assets/star.png');
    this.load.image('bomb', '../assets/bomb.png');
    this.load.spritesheet('dude', '../assets/dude.png', { frameWidth: 32, frameHeight: 48 });
}

//create ()显示图像
function create (){
    //一个简单的游戏背景
    this.add.image(400, 300, 'sky');

    //平台组包括地面和三个我们可以跳上去的平台
    //this.physics:含义是我们要使用物理引擎，这句代码创建了一个静态物体组
    //在Arcade物理模式中，有两个属性的物体:动体和静体
    platforms = this.physics.add.staticGroup();

    //这里我们创建地面，缩放它以适应游戏的宽度(原始精灵的大小是400x32)。
    //调用方法setScale(2),将图片拉宽到两倍,refreshBody()告诉系统更新它。
    platforms.create(400, 568, 'ground').setScale(2).refreshBody();;

    //创建三个我们可以跳上去的平台
    platforms.create(600, 400, 'ground');
    platforms.create(50, 250, 'ground');
    platforms.create(750, 220, 'ground');

    //角色及其设置
    player = this.physics.add.sprite(100, 450, 'dude');

    //角色的物理属性。把这个小家伙轻轻弹跳一下。
    //给角色赋予一个较小的弹力值0.2。这样玩家落地是会轻微弹起一点。
    player.setBounce(0.2);
    //设定精灵会和场景的边沿碰撞，确保其不会出画
    player.setCollideWorldBounds(true);

    // 我们角色动画，站立，向左走和向右走。
    this.anims.create({
        key: 'left', // 向左走
        frames: this.anims.generateFrameNumbers('dude', { start: 0, end: 3 }), // 向左的动画使用了第0帧至第3帧
        frameRate: 10,//帧率是每秒10帧
        repeat: -1 //循环播放动画
    });

    this.anims.create({
        key: 'turn',
        frames: [ { key: 'dude', frame: 4 } ],
        frameRate: 20
    });

    this.anims.create({
        key: 'right',
        frames: this.anims.generateFrameNumbers('dude', { start: 5, end: 8 }),
        frameRate: 10,
        repeat: -1
    });

    //  输入事件
    cursors = this.input.keyboard.createCursorKeys();
    // Phaser.Input.Keyboard.KeyCodes.Q

    //  收集一些恒星，总共12颗，沿着x轴平均间隔70个像素
    stars = this.physics.add.group({
        key: 'star',//图片关键字
        repeat: 11,//自动创建一个子元素，再重复11次，这样游戏中就一共有了12个元素
        setXY: { x: 12, y: 0, stepX: 70 }//第一个子元素定位在(12,0)，后面的每个在x方向上间隔70
    });

    stars.children.iterate(function (child) {
        //  给每颗星星一个稍微不同的弹跳
        child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
    });

    // 一组炸弹
	bombs = this.physics.add.group();

    //创建一个碰撞器对象，物理引擎会监视他们检测它们是否发生碰撞或重叠
    this.physics.add.collider(player, platforms);
    //对星星和平台进行碰撞检测
    this.physics.add.collider(stars, platforms);
	// 对炸弹和平台进行碰撞检测
	this.physics.add.collider(bombs, platforms);
    //  检查玩家是否与任何星星重叠，如果他确实重叠,则调用collectStar函数
    this.physics.add.overlap(player, stars, collectStar, null, this);
    //  检查玩家是否与任何星星炸弹，如果他确实重叠,则调用hitBomb函数
	this.physics.add.collider(player, bombs, hitBomb, null, this);

    //  The score
	// 16,16是文本显示的坐标。‘score:0’是初始显示的内容，后面的对象定义了文字的大小和颜色。这里不设置字体，我们使用Phaser默认的Courier字体。
    scoreText = this.add.text(16, 16, 'score: 0', { fontSize: '32px', fill: '#000' });

}

//逻辑实现
function update (){
    if (gameOver){
        return;
    }
    if (cursors.left.isDown){ //左键是否按下,按下则移动角色并播放相应动画
        player.setVelocityX(-160);
        player.anims.play('left', true);
    }else if (cursors.right.isDown){ //右键是否按下
        player.setVelocityX(160);
		player.anims.play('right', true);
    }else{ //否则现家站立
        player.setVelocityX(0);
        player.anims.play('turn');
    }

	// 满足上键按下和角色正在地面上才允许跳跃
    if (cursors.up.isDown && player.body.touching.down){
        player.setVelocityY(-330);
    }
}

function collectStar (player, star){
    star.disableBody(true, true);// 让星星消失

    //  添加和更新分数
    // 每拿到一个星星会加10分，并更新记分牌scoreText的内容
    score += 10;
    scoreText.setText('Score: ' + score);

    if (stars.countActive(true) === 0)
    {
        //  要收集的新一批星星
        // 查看还有多少星星是活动。如果没有，说明玩家已将拿到了所有的星星。然后我们调用iterate函数重新激活所有的星星，并把它们的y轴位置设为0 。于是它们会在次从屏幕顶部落下
        stars.children.iterate(function (child) {
            child.enableBody(true, child.x, 0, true, true);
        });

		// 制造炸弹了，我们首先会为炸弹产生一个随机的x坐标，但会避开玩家的位置，让人感觉这是偶然发生的。炸弹会在屏幕内弹跳、碰撞。它们不会受到重力的影响，而且速度是随机的。
        var x = (player.x < 400) ? Phaser.Math.Between(400, 800) : Phaser.Math.Between(0, 400);

        var bomb = bombs.create(x, 16, 'bomb');
        bomb.setBounce(1);
        bomb.setCollideWorldBounds(true);
        bomb.setVelocity(Phaser.Math.Between(-200, 200), 20);
        bomb.allowGravity = false;
    }

}

function hitBomb (player, bomb){
    this.physics.pause();

    player.setTint(0xff0000);

    player.anims.play('turn');

    gameOver = true;
}