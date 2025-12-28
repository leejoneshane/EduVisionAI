import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

// Register Traditional Chinese Fonts
// Switching to "JustFont Open Huninn" (jf-openhuninn) via jsDelivr.
// This provides a stable TTF file which is fully compatible with @react-pdf/renderer.
// Previous Noto Sans sources were causing "Unknown font format" errors due to WOFF2/Variable font issues or 404s.
Font.register({
  family: 'NotoSansTC',
  fonts: [
    { src: 'https://cdn.jsdelivr.net/npm/open-huninn-font@1.1.0/font/jf-openhuninn-1.1.ttf' },
    { src: 'https://cdn.jsdelivr.net/npm/open-huninn-font@1.1.0/font/jf-openhuninn-1.1.ttf', fontWeight: 'bold' }
  ]
});

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'NotoSansTC',
    fontSize: 12,
    lineHeight: 1.6,
    color: '#334155'
  },
  header: {
    fontSize: 24,
    marginBottom: 20,
    fontFamily: 'NotoSansTC',
    fontWeight: 'bold',
    color: '#1e293b',
    textAlign: 'center'
  },
  sectionTitle: {
    fontSize: 16,
    marginTop: 20,
    marginBottom: 10,
    fontFamily: 'NotoSansTC',
    fontWeight: 'bold',
    color: '#4338ca', // Indigo-700
    backgroundColor: '#e0e7ff', // Indigo-50
    padding: 6,
    borderRadius: 4
  },
  subTitle: {
    fontSize: 14,
    marginTop: 12,
    marginBottom: 6,
    fontFamily: 'NotoSansTC',
    fontWeight: 'bold',
    color: '#334155'
  },
  text: {
    marginBottom: 6,
    textAlign: 'justify'
  },
  listItem: {
    marginLeft: 15,
    marginBottom: 4
  },
  promptBlock: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#f1f5f9',
    borderRadius: 4,
    fontFamily: 'NotoSansTC', 
    fontSize: 10,
    color: '#475569'
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 9,
    color: '#94a3b8'
  }
});

interface EduPdfDocumentProps {
  content: string;
}

export const EduPdfDocument: React.FC<EduPdfDocumentProps> = ({ content }) => {
  // Simple markdown parser to convert text string into PDF components
  const renderContent = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, index) => {
      const trimmed = line.trim();
      
      if (!trimmed) return <View key={index} style={{ height: 6 }} />;

      // H1 (though mostly used for titles in MD, we use explicit header)
      if (trimmed.startsWith('# ')) {
        return <Text key={index} style={styles.header}>{trimmed.replace('# ', '')}</Text>;
      }

      // Section Headers (1️⃣, 2️⃣, or ##)
      if (trimmed.startsWith('## ') || trimmed.startsWith('1️⃣') || trimmed.startsWith('2️⃣') || trimmed.startsWith('3️⃣')) {
        return <Text key={index} style={styles.sectionTitle}>{trimmed.replace(/^[#\s]+/, '')}</Text>;
      }

      // Subheaders
      if (trimmed.startsWith('### ')) {
        return <Text key={index} style={styles.subTitle}>{trimmed.replace('### ', '')}</Text>;
      }

      // Bullet points
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        return (
          <View key={index} style={{ flexDirection: 'row', marginBottom: 4 }}>
            <Text style={{ width: 15, marginLeft: 5 }}>•</Text>
            <Text style={{ flex: 1 }}>{trimmed.replace(/^[-*]\s/, '')}</Text>
          </View>
        );
      }

      // JSON Code Block detection (Skip the raw JSON in the PDF for cleaner reading, or style it differently)
      if (trimmed.startsWith('```')) {
        return null; // Skip code block markers
      }
      if (trimmed.includes('"prompt":')) {
         // It's likely inside the JSON block. Let's format it simply.
         return <Text key={index} style={styles.promptBlock}>{trimmed}</Text>;
      }

      // Normal Text
      return <Text key={index} style={styles.text}>{trimmed}</Text>;
    });
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.header}>EduVision 教學計劃</Text>
        {renderContent(content)}
        <Text style={styles.footer} render={({ pageNumber, totalPages }) => (
          `EduVision AI Generated • Page ${pageNumber} / ${totalPages}`
        )} fixed />
      </Page>
    </Document>
  );
};
