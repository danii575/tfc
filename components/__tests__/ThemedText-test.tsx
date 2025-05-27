import React from 'react';
import { Text, TextProps } from 'react-native';

type ThemedTextProps = TextProps & {
  children: React.ReactNode;
};

export const ThemedText: React.FC<ThemedTextProps> = ({ children, ...rest }) => {
  return <Text {...rest}>{children}</Text>;
};
