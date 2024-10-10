import React, { useEffect, useState } from 'react';
import { View, Text, Button, StyleSheet, Alert } from 'react-native';
import { getAuth, sendEmailVerification } from "firebase/auth";

const VerifyEmailPage = ({ navigation }) => { // Receive navigation prop
    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState(null);
    const auth = getAuth();

    useEffect(() => {
        const checkUser = () => {
            const currentUser = auth.currentUser;
            setUser(currentUser);
        };

        const interval = setInterval(() => {
            if (user) {
                user.reload().then(() => {
                    if (user.emailVerified) {
                        Alert.alert("Email Verified!", "You can now send chat requests.");
                        navigation.goBack(); // Navigate back to RequestChat page
                    }
                });
            }
        }, 5000); // Check every 5 seconds

        checkUser();
        return () => clearInterval(interval); // Cleanup on unmount
    }, [user, navigation]);

    const handleVerifyEmail = async () => {
        if (user) {
            setLoading(true);
            try {
                await sendEmailVerification(user);
                Alert.alert("Verification email sent! Please check your inbox.");
            } catch (error) {
                console.error("Error sending verification email:", error);
                Alert.alert("Error: " + error.message);
            } finally {
                setLoading(false);
            }
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Email Verification</Text>
            <Text>Please verify your email address to continue.</Text>
            <Button title={loading ? "Sending..." : "Resend Verification Email"} onPress={handleVerifyEmail} disabled={loading} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
    },
    title: {
        fontSize: 24,
        marginBottom: 20,
        textAlign: 'center',
    },
});

export default VerifyEmailPage;
