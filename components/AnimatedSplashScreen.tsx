import React, { useEffect, useState } from "react";
import { StyleSheet, View, Image, Dimensions } from "react-native";
import * as SplashScreen from "expo-splash-screen";

const { width, height } = Dimensions.get("window");

interface AnimatedSplashScreenProps {
    onAnimationFinish: () => void;
}

export default function AnimatedSplashScreen({
    onAnimationFinish,
}: AnimatedSplashScreenProps) {
    useEffect(() => {
        // Set a timeout based on the GIF duration (guess-estimate or fixed time)
        // GIFs usually play for a few seconds. Let's start with 3 seconds.
        const timer = setTimeout(() => {
            onAnimationFinish();
        }, 3500); // 3.5 seconds for the GIF to play

        return () => clearTimeout(timer);
    }, [onAnimationFinish]);

    return (
        <View style={styles.container}>
            <Image
                source={require("../assets/images/splash-screen.gif")}
                style={styles.image}
                resizeMode="cover"
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#000", // Match app.json background
        justifyContent: "center",
        alignItems: "center",
    },
    image: {
        width: width,
        height: height,
    },
});
