import React, {Fragment, useRef} from 'react';
import {Dimensions, Image, Platform, StatusBar, Text, View} from 'react-native';
import {styles} from './styles';
const {height, width} = Dimensions.get('window');
import Video from 'react-native-video';

interface DesignProps {}

function Design({}: DesignProps): React.JSX.Element {
  return (
    <Fragment>
      <StatusBar
        translucent
        backgroundColor={'transparent'}
        barStyle={'light-content'}
      />
      <View style={styles.container}>
        <Video
          source={require('../../assets/videos/splash-screen.mp4')}
          style={{width, height: height + (Platform.OS == 'ios' ? 20 : 50)}}
          muted
          repeat={false}
          controls={false}
          resizeMode="cover"
          onEnd={() => {
            /* navigate to next screen */
          }}
        />
      </View>
    </Fragment>
  );
}

export default Design;
