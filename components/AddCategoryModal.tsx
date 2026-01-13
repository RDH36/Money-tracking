import { useState } from 'react';
import { Pressable, ScrollView } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { Ionicons } from '@expo/vector-icons';
import { Box } from '@/components/ui/box';
import { HStack } from '@/components/ui/hstack';
import { VStack } from '@/components/ui/vstack';
import { Text } from '@/components/ui/text';
import { Heading } from '@/components/ui/heading';
import { Button, ButtonText } from '@/components/ui/button';
import { Input, InputField } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogBackdrop,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
} from '@/components/ui/alert-dialog';
import { useTheme } from '@/contexts';

const CATEGORY_ICONS = [
  { icon: 'fast-food', label: 'Nourriture' },
  { icon: 'car', label: 'Transport' },
  { icon: 'bag', label: 'Shopping' },
  { icon: 'document-text', label: 'Factures' },
  { icon: 'medical', label: 'Santé' },
  { icon: 'game-controller', label: 'Loisirs' },
  { icon: 'school', label: 'Éducation' },
  { icon: 'cube', label: 'Autre' },
  { icon: 'home', label: 'Maison' },
  { icon: 'gift', label: 'Cadeaux' },
  { icon: 'airplane', label: 'Voyage' },
  { icon: 'cafe', label: 'Café' },
];

const CATEGORY_COLORS = [
  '#FF6B6B', '#4ECDC4', '#9B59B6', '#3498DB',
  '#2ECC71', '#F39C12', '#1ABC9C', '#95A5A6',
  '#E74C3C', '#8E44AD', '#16A085', '#D35400',
];

interface AddCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateCategory: (params: {
    name: string;
    icon: string;
    color: string;
  }) => Promise<{ success: boolean; limitReached: boolean }>;
  canCreateCategory: boolean;
  customCategoriesCount: number;
  maxCustomCategories: number;
}

export function AddCategoryModal({
  isOpen,
  onClose,
  onCreateCategory,
  canCreateCategory,
  customCategoriesCount,
  maxCustomCategories,
}: AddCategoryModalProps) {
  const { theme } = useTheme();
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('cube');
  const [color, setColor] = useState('#3498DB');
  const [isCreating, setIsCreating] = useState(false);

  const resetForm = () => {
    setName('');
    setIcon('cube');
    setColor('#3498DB');
  };

  const handleCreate = async () => {
    if (!name.trim() || !canCreateCategory) return;
    setIsCreating(true);
    const result = await onCreateCategory({
      name: name.trim(),
      icon,
      color,
    });
    if (result.success) {
      resetForm();
      onClose();
    }
    setIsCreating(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Show limit reached view
  if (!canCreateCategory) {
    return (
      <AlertDialog isOpen={isOpen} onClose={handleClose}>
        <AlertDialogBackdrop />
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <HStack space="sm" className="items-center">
              <Box
                className="w-10 h-10 rounded-full items-center justify-center"
                style={{ backgroundColor: '#FEE2E2' }}
              >
                <Ionicons name="alert-circle" size={24} color="#EF4444" />
              </Box>
              <Heading size="md" className="text-typography-900">Limite atteinte</Heading>
            </HStack>
          </AlertDialogHeader>
          <AlertDialogBody className="mt-3 mb-4">
            <Text className="text-typography-600">
              Vous avez atteint la limite de {maxCustomCategories} catégories personnalisées.
            </Text>
          </AlertDialogBody>
          <AlertDialogFooter>
            <Button
              style={{ backgroundColor: theme.colors.primary }}
              onPress={handleClose}
            >
              <ButtonText className="text-white">Compris</ButtonText>
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  return (
    <AlertDialog isOpen={isOpen} onClose={handleClose}>
      <AlertDialogBackdrop />
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <HStack className="items-center justify-between w-full">
            <Heading size="md" className="text-typography-900">Nouvelle catégorie</Heading>
            <Text className="text-typography-500 text-sm">
              {customCategoriesCount}/{maxCustomCategories}
            </Text>
          </HStack>
        </AlertDialogHeader>
        <AlertDialogBody className="mt-3 mb-4">
          <KeyboardAwareScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bottomOffset={20}
            style={{ maxHeight: 400 }}
          >
            <VStack space="lg">
              <VStack space="sm">
                <Text className="text-typography-700 font-medium">Nom de la catégorie</Text>
                <Input size="md">
                  <InputField
                    placeholder="Ex: Restaurants, Sport..."
                    value={name}
                    onChangeText={setName}
                  />
                </Input>
              </VStack>

              <VStack space="sm">
                <Text className="text-typography-700 font-medium">Icône</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <HStack space="sm">
                    {CATEGORY_ICONS.map((item) => (
                      <Pressable key={item.icon} onPress={() => setIcon(item.icon)}>
                        <Box
                          className="w-12 h-12 rounded-xl border-2 items-center justify-center"
                          style={{
                            borderColor: icon === item.icon ? color : '#E5E5E5',
                            backgroundColor: icon === item.icon ? `${color}20` : '#FFF',
                          }}
                        >
                          <Ionicons
                            name={item.icon as keyof typeof Ionicons.glyphMap}
                            size={24}
                            color={icon === item.icon ? color : '#666'}
                          />
                        </Box>
                      </Pressable>
                    ))}
                  </HStack>
                </ScrollView>
              </VStack>

              <VStack space="sm">
                <Text className="text-typography-700 font-medium">Couleur</Text>
                <HStack space="sm" className="flex-wrap">
                  {CATEGORY_COLORS.map((c) => (
                    <Pressable key={c} onPress={() => setColor(c)}>
                      <Box
                        className="w-10 h-10 rounded-full border-2 items-center justify-center"
                        style={{
                          backgroundColor: c,
                          borderColor: color === c ? '#000' : 'transparent',
                        }}
                      >
                        {color === c && (
                          <Ionicons name="checkmark" size={20} color="#FFF" />
                        )}
                      </Box>
                    </Pressable>
                  ))}
                </HStack>
              </VStack>

              <Box
                className="p-3 rounded-xl items-center"
                style={{ backgroundColor: `${color}20` }}
              >
                <Box
                  className="w-14 h-14 rounded-full items-center justify-center mb-2"
                  style={{ backgroundColor: color }}
                >
                  <Ionicons
                    name={icon as keyof typeof Ionicons.glyphMap}
                    size={28}
                    color="#FFF"
                  />
                </Box>
                <Text className="font-medium" style={{ color }}>
                  {name || 'Aperçu'}
                </Text>
              </Box>
            </VStack>
          </KeyboardAwareScrollView>
        </AlertDialogBody>
        <AlertDialogFooter>
          <Button variant="outline" onPress={handleClose} isDisabled={isCreating}>
            <ButtonText>Annuler</ButtonText>
          </Button>
          <Button
            style={{ backgroundColor: theme.colors.primary }}
            onPress={handleCreate}
            isDisabled={!name.trim() || isCreating}
          >
            <ButtonText className="text-white">
              {isCreating ? 'Création...' : 'Créer'}
            </ButtonText>
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
