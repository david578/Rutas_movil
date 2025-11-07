import { IconSymbol } from '@/components/ui/icon-symbol';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* Título */}
      <Text style={styles.title}>¡Bienvenido a Tu Adminastrador de tareas!</Text>

      {/* Iconos grandes y coloridos */}
      <View style={styles.iconRow}>
        <IconSymbol name="checkmark.circle.fill" size={80} color="#4CAF50" />
        <IconSymbol name="list.bullet.rectangle.fill" size={80} color="#FFB400" />
        <IconSymbol name="calendar" size={80} color="#FF6F61" />
      </View>

      {/* Subtítulo */}
      <Text style={styles.subtitle}>
        Organiza tus tareas de manera fácil y eficiente.
      </Text>

      {/* Botón grande */}
      <TouchableOpacity
        style={styles.button}
        activeOpacity={0.8}
        onPress={() => router.push('/listTask')}
      >
        <Text style={styles.buttonText}>Ir a mis Tareas</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#333',
    textAlign: 'center',
  },
  iconRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '80%',
    marginBottom: 30,
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 50,
    color: '#666',
  },
  button: {
    backgroundColor: '#4CAF50',
    paddingVertical: 20,
    paddingHorizontal: 70,
    borderRadius: 35,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: 'bold',
  },
});
