const cards = (function() {
  const DeckType = Object.freeze({
    STANDARD: 0,
    EUCHRE: 1,
    PINOCHLE: 2
  });

  //The global options
  var opt = {
    cardSize: {
      width: 69,
      height: 94,
      padding: 18
    },
    animationSpeed: 500,
    table: 'body',
    cardback: 'red',
    acesHigh: false,
    cardsUrl: 'img/cards.png',
    blackJoker: false,
    redJoker: false,
    type: DeckType.STANDARD,
    loop: 1
  };
  var zIndexCounter = 1;
  var all = []; //All the cards created.
  var start = 1;
  var end = start + 12;

  function mouseEvent(ev) {
    const card = this.card;
    if (card.container) {
      var handler = card.container._click;
      if (handler) {
        handler.func.call(handler.context || window, card, ev);
      }
    }
  }

  const hasOwnProperty = Object.prototype.hasOwnProperty;

  function init(options) {
    if (options) {
      for (let i in options) {
        if (hasOwnProperty.call(opt, i)) {
          opt[i] = options[i];
        }
      }
    }
    if (typeof opt.table === 'string') {
      opt.table = document.querySelector(opt.table);
    }
    const style = window.getComputedStyle(opt.table)
    const position = style.getPropertyValue('position');
    if (position == 'static') {
      opt.table.style.position = 'relative';
    }
    switch (opt.type) {
      case DeckType.STANDARD:
        start = opt.acesHigh ? 2 : 1;
        end = start + 12;
        break;
      case DeckType.EUCHRE:
        start = 9;
        end = start + 5;
        break;
      case DeckType.PINOCHLE:
        start = 9;
        end = start + 5;
        opt.loop = 2;
        break;
    }
    for (let l = 0; l < opt.loop; l++)
      for (let i = start; i <= end; i++) {
        all.push(new Card('h', i, opt.table));
        all.push(new Card('s', i, opt.table));
        all.push(new Card('d', i, opt.table));
        all.push(new Card('c', i, opt.table));
      }
    if (opt.blackJoker) {
      all.push(new Card('bj', 0, opt.table));
    }
    if (opt.redJoker) {
      all.push(new Card('rj', 0, opt.table));
    }
    shuffle(all);
  }

  function shuffle(deck) {
    //Fisher yates shuffle
    var i = deck.length;
    if (i == 0) return;
    while (--i) {
      var j = Math.floor(Math.random() * (i + 1));
      var tempi = deck[i];
      var tempj = deck[j];
      deck[i] = tempj;
      deck[j] = tempi;
    }
  }

  function Card(suit, rank, table) {
    this.init(suit, rank, table);
  }

  Card.prototype = {
    init: function(suit, rank, table) {
      this.shortName = suit + rank;
      this.suit = suit;
      this.rank = rank;
      this.name = suit.toUpperCase() + rank;
      this.faceUp = false;

      const el = this.el = document.createElement('div');
      const style = el.style;
      style.width = opt.cardSize.width + 'px';
      style.height = opt.cardSize.height + 'px';
      style.backgroundImage = 'url(' + opt.cardsUrl + ')';
      style.position = 'absolute';
      style.cursor = 'pointer';
      el.classList.add('card');
      el.card = this;
      el.onclick = mouseEvent;
      table.appendChild(el);

      this.showCard();
      this.moveToFront();
    },

    toString: function() {
      return this.name;
    },

    moveTo: function(x, y, speed, callback) {
      var props = {
        top: y - (opt.cardSize.height / 2),
        left: x - (opt.cardSize.width / 2)
      };
      this.el.velocity(props, speed || opt.animationSpeed, callback);
    },

    rotate: function(angle) {
      const style = this.el.style;
      style.webkitTransform = style.MozTransform = style.msTransform = style.transform = style.OTransform = 'rotate(' + angle + 'deg)';
    },

    showCard: function() {
      const offsets = {
        "c": 0,
        "d": 1,
        "h": 2,
        "s": 3,
        "rj": 2,
        "bj": 3
      };
      var xpos, ypos;
      var rank = this.rank;
      if (rank == 14) {
        rank = 1; //Aces high must work as well.
      }
      xpos = -rank * opt.cardSize.width;
      ypos = -offsets[this.suit] * opt.cardSize.height;
      this.rotate(0);
      this.el.style.backgroundPosition = xpos + 'px ' + ypos + 'px';
    },

    hideCard: function() {
      var y = opt.cardback == 'red' ? 0 * opt.cardSize.height : -1 * opt.cardSize.height;
      this.el.style.backgroundPosition = '0px ' + y + 'px';
      this.rotate(0);
    },

    moveToFront: function() {
      this.el.style.zIndex = zIndexCounter++;
    }
  };

  function Container() {

  }

  Container.prototype = new Array();
  Container.prototype.extend = function(obj) {
    for (var prop in obj) {
      this[prop] = obj[prop];
    }
  }
  Container.prototype.extend({
    options: opt,

    hasCard: function (card) {
      return this.indexOf(card) !== -1;
    },

    addCard: function(card) {
      this.addCards([card]);
    },

    addCards: function(cards) {
      cards = cards.slice();
      for (var i = 0; i < cards.length; i++) {
        var card = cards[i];
        if (card.container) {
          card.container.removeCard(card);
        }
        this.push(card);
        card.container = this;
      }
    },

    removeCard: function(card) {
      for (var i = 0; i < this.length; i++) {
        if (this[i] == card) {
          this.splice(i, 1);
          return true;
        }
      }
      return false;
    },

    ofSuit: function (suit) {
      return this.filter(function (card) {
        return suit == card.suit;
      }).sort(function (a, b) {
        return a.rank - b.rank;
      });
    },

    shuffle: function () {
      shuffle(this);
    },

    init: function(options) {
      options = options || {};
      this.x = options.x || opt.table.clientWidth / 2;
      this.y = options.y || opt.table.clientHeight / 2;
      this.faceUp = options.faceUp;
    },

    click: function(func, context) {
      this._click = {
        func: func,
        context: context
      };
    },

    mousedown: function(func, context) {
      this._mousedown = {
        func: func,
        context: context
      };
    },

    mouseup: function(func, context) {
      this._mouseup = {
        func: func,
        context: context
      };
    },

    render: function(options) {
      options = options || {};
      var speed = options.speed || opt.animationSpeed;
      this.calcPosition(options);
      for (var i = 0; i < this.length; i++) {
        var card = this[i];
        zIndexCounter++;
        card.moveToFront();
        var top = parseInt(card.el.style.top);
        var left = parseInt(card.el.style.left);
        if (top != card.targetTop || left != card.targetLeft) {
          var props = {
            top: card.targetTop,
            left: card.targetLeft,
            queue: false
          };
          if (options.immediate) {
            const style = card.el.style;
            style.top = card.targetTop + 'px';
            style.left = card.targetLeft + 'px';
            card.el.velocityData && (card.el.velocityData.cache = {});
          } else {
            card.el.velocity(props, speed);
          }
        }
      }
      var me = this;
      var flip = function() {
        for (var i = 0; i < me.length; i++) {
          if (me.faceUp) {
            me[i].showCard();
          } else {
            me[i].hideCard();
          }
        }
      }
      if (options.immediate) {
        flip();
      } else {
        setTimeout(flip, speed / 2);
      }

      if (options.callback) {
        setTimeout(options.callback, speed);
      }
    },

    topCard: function() {
      return this[this.length - 1];
    },

    toString: function() {
      return 'Container';
    }
  });

  function Deck(options) {
    this.init(options);
  }

  Deck.prototype = new Container();
  Deck.prototype.extend({
    calcPosition: function() {
      var left = Math.round(this.x - opt.cardSize.width / 2, 0);
      var top = Math.round(this.y - opt.cardSize.height / 2, 0);
      var condenseCount = 6;
      for (var i = 0; i < this.length; i++) {
        if (i > 0 && i % condenseCount == 0) {
          top -= 1;
          left -= 1;
        }
        this[i].targetTop = top;
        this[i].targetLeft = left;
      }
    },

    toString: function() {
      return 'Deck';
    },

    deal: function(count, hands, speed, callback) {
      var me = this;
      var i = 0;
      var totalCount = count * hands.length;

      function dealOne() {
        if (me.length == 0 || i == totalCount) {
          if (callback) {
            callback();
          }
          return;
        }
        hands[i % hands.length].addCard(me.topCard());
        hands[i % hands.length].render({
          callback: dealOne,
          speed: speed
        });
        i++;
      }
      dealOne();
    }
  });

  function Hand(options) {
    this.init(options);
  }
  Hand.prototype = new Container();
  Hand.prototype.extend({
    calcPosition: function() {
      var width = opt.cardSize.width + (this.length - 1) * opt.cardSize.padding;
      var left = Math.round(this.x - width / 2);
      var top = Math.round(this.y - opt.cardSize.height / 2, 0);
      for (var i = 0; i < this.length; i++) {
        this[i].targetTop = top;
        this[i].targetLeft = left + i * opt.cardSize.padding;
      }
    },

    toString: function() {
      return 'Hand';
    }
  });

  function Pile(options) {
    this.init(options);
  }

  Pile.prototype = new Container();
  Pile.prototype.extend({
    calcPosition: function() {
    },

    toString: function() {
      return 'Pile';
    },

    deal: function(count, hands) {
      if (!this.dealCounter) {
        this.dealCounter = count * hands.length;
      }
    }
  });


  return {
    init: init,
    all: all,
    options: opt,
    SIZE: opt.cardSize,
    Card: Card,
    Container: Container,
    Deck: Deck,
    Hand: Hand,
    Pile: Pile,
    DeckType: DeckType,
    shuffle: shuffle
  };
})();

if (typeof module !== 'undefined') {
  module.exports = cards;
}
