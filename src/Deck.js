import React, { Component } from 'react';
// prettier-ignore
import { 
    View, 
    Animated, 
    PanResponder, 
    Dimensions, 
    LayoutAnimation, 
    UIManager 
} from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = 0.25 * SCREEN_WIDTH;
const SWIPE_OUT_DURATION = 250;

class Deck extends Component {
  // 'Static' defines a class property, or a property that can be accessed without creating an instance of the class.
  // If user doesn't pass these properties, these default properties will be used.
  static defaultProps = {
    onSwipeRight: () => {},
    onSwipeLeft: () => {}
  };

  constructor(props) {
    super(props);

    this.position = null;
    this.panResponder = null;
    this.state = { index: 0 };

    const position = new Animated.ValueXY(); // default position

    const panResponder = PanResponder.create({
      // true: executed when user touches the screen
      onStartShouldSetPanResponder: () => true,

      // When user drags on the screen
      // Only one gesture is used.  It's reused.
      onPanResponderMove: (event, gesture) => {
        position.setValue({ x: gesture.dx, y: gesture.dy });
      },

      // When user releases the screen
      onPanResponderRelease: (event, gesture) => {
        if (gesture.dx > SWIPE_THRESHOLD) {
          this.forceSwipe('right');
        } else if (gesture.dx < -SWIPE_THRESHOLD) {
          this.forceSwipe('left');
        } else {
          this.resetPosition();
        }
      }
    });

    // this.state = { panResponder, position }; // this is what doc says, but agains the rules about state
    this.panResponder = panResponder;
    this.position = position;
  }

  shouldComponentUpdate(nextProps) {
    if (nextProps.data !== this.props.data) {
      this.setState({ index: 0 });
    }
    // For Android
    UIManager.setLayoutAnimationEnabledExperimental && UIManager.setLayoutAnimationEnabledExperimental(true);

    LayoutAnimation.spring();
    return true;
  }

  forceSwipe = direction => {
    const x = direction === 'right' ? SCREEN_WIDTH : -SCREEN_WIDTH;
    Animated.timing(this.position, {
      toValue: { x, y: 0 },
      duration: SWIPE_OUT_DURATION
    }).start(() => this.swipeComplete(direction));
  };

  swipeComplete = direction => {
    const { onSwipeLeft, onSwipeRight, data } = this.props;
    const item = data[this.state.index];
    direction === 'right' ? onSwipeRight(item) : onSwipeLeft(item);

    this.position.setValue({ x: 0, y: 0 }); // default position
    this.setState(state => {
      return { index: this.state.index + 1 };
    });
  };

  resetPosition = () => {
    // happens in the default of 1 second
    Animated.spring(this.position, {
      toValue: { x: 0, y: 0 }
    }).start();
  };

  getCardStyle = () => {
    console.log(this.position.getLayout());

    // e.g. If user drags 500 units to left -> -120deg retation.
    const rotate = this.position.x.interpolate({
      // inputRange: [-500, 0, 500],
      inputRange: [-SCREEN_WIDTH * 1.5, 0, SCREEN_WIDTH * 1.5],
      outputRange: ['-120deg', '0deg', '120deg']
    });
    console.log('rotate', rotate);
    return {
      ...this.position.getLayout(),
      transform: [{ rotate }]
    };
  };

  renderCards = () => {
    if (this.state.index >= this.props.data.length) {
      return this.props.renderNoMoreCards();
    }

    return this.props.data
      .map((item, i) => {
        if (i < this.state.index) {
          return null; // don't render - it was already swiped
        }

        // When card goes from View to Animated.View, image is refetched.
        // Use View
        if (i === this.state.index) {
          return (
            // prettier-ignore
            <Animated.View
              key={item.id} 
              style={[this.getCardStyle(), styles.cardStyle]}
              {...this.panResponder.panHandlers}>
              {this.props.renderCard(item)}
            </Animated.View>
          );
        }

        // Originally it was View, but when card goes from View to Animated.View, image is refetched.
        // This causes image to flash. -> use Animated.View
        return (
          // prettier-ignore
          <Animated.View
            key={item.id} 
            style={[styles.cardStyle, { top: 10 * (i - this.state.index)}]}> 
            {this.props.renderCard(item)}
          </Animated.View>
        );
      })
      .reverse(); // to show # on the top.
  };

  render() {
    return <View>{this.renderCards()}</View>;
  }
}
const styles = {
  cardStyle: {
    width: SCREEN_WIDTH, // left:0, right:0 can be used instead if we are not manipulating positions.
    position: 'absolute'
  }
};
export default Deck;
