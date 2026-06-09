import { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Modal, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { Text } from '@/src/components/Text';
import { Input } from '@/src/components/Input';
import { Button } from '@/src/components/Button';
import { colors, radii } from '@/src/theme';
import { api } from '@/src/api';
import { useAuth } from '@/src/AuthContext';
import { useToast } from '@/src/components/Toast';

const QUICK = [100, 200, 500, 1000, 2000, 5000];

function buildCheckoutHtml(order: any) {
  return `<!DOCTYPE html><html><head>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<style>body{margin:0;background:#05050A;color:#fff;font-family:system-ui;display:flex;align-items:center;justify-content:center;min-height:100vh;text-align:center}</style>
<script src="https://checkout.razorpay.com/v1/checkout.js"></script>
</head><body>
<div><h2 style="color:#00E5FF">Loading Razorpay…</h2></div>
<script>
function post(o){window.ReactNativeWebView&&window.ReactNativeWebView.postMessage(JSON.stringify(o));}
var options=${JSON.stringify({
  key: order.key_id,
  amount: order.amount,
  currency: order.currency,
  order_id: order.order_id,
  name: order.name,
  description: order.description,
  prefill: order.prefill,
  theme: { color: '#00E5FF' },
})};
options.handler=function(r){post({type:'success',payload:r});};
options.modal={ondismiss:function(){post({type:'dismiss'});}};
var rzp=new Razorpay(options);
rzp.on('payment.failed',function(r){post({type:'failed',payload:r.error||r});});
window.addEventListener('load',function(){setTimeout(function(){rzp.open();},300);});
</script></body></html>`;
}

export default function Deposit() {
  const router = useRouter();
  const { refresh } = useAuth();
  const toast = useToast();
  const [amount, setAmount] = useState('500');
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<any>(null);
  const [verifying, setVerifying] = useState(false);

  const startPayment = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt < 10) return toast.show('Min ₹10', 'error');
    setLoading(true);
    try {
      const o: any = await api.createOrder(amt);
      setOrder(o);
    } catch (e: any) {
      toast.show(e.message || 'Failed to create order', 'error');
    } finally {
      setLoading(false);
    }
  };

  const onMessage = async (raw: string) => {
    let msg: any;
    try { msg = JSON.parse(raw); } catch { return; }
    if (msg.type === 'success' && msg.payload) {
      setVerifying(true);
      try {
        await api.verifyPayment({
          razorpay_order_id: msg.payload.razorpay_order_id,
          razorpay_payment_id: msg.payload.razorpay_payment_id,
          razorpay_signature: msg.payload.razorpay_signature,
        });
        toast.show(`₹${order?.amount / 100} added to wallet!`, 'success');
        await refresh();
        setOrder(null);
        router.back();
      } catch (e: any) {
        toast.show(e.message || 'Verification failed', 'error');
      } finally {
        setVerifying(false);
      }
    } else if (msg.type === 'failed') {
      toast.show('Payment failed', 'error');
      setOrder(null);
    } else if (msg.type === 'dismiss') {
      setOrder(null);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 }}>
        <TouchableOpacity onPress={() => router.back()} testID="back"><Ionicons name="chevron-back" size={26} color="#fff" /></TouchableOpacity>
        <Text style={{ fontSize: 22, fontWeight: '900' }}>Add Money</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <View style={{ backgroundColor: 'rgba(0,229,255,0.08)', borderColor: colors.borderActive, borderWidth: 1, padding: 12, borderRadius: radii.md, marginBottom: 16 }}>
          <Text style={{ fontSize: 12, color: colors.primary }}>🔒 Razorpay secure payments · UPI / Cards / Netbanking</Text>
          <Text muted style={{ fontSize: 11, marginTop: 4 }}>Test mode · Use UPI ID `success@razorpay` or card `4111 1111 1111 1111` (any CVV/expiry)</Text>
        </View>
        <Input label="Amount (₹)" value={amount} onChangeText={setAmount} keyboardType="numeric" testID="deposit-amount" />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
          {QUICK.map((q) => (
            <TouchableOpacity key={q} onPress={() => setAmount(String(q))} style={st.quick} testID={`quick-${q}`}>
              <Text style={{ fontWeight: '800', color: colors.primary }}>₹{q}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Button title={`Pay ₹${amount || 0}`} onPress={startPayment} loading={loading} testID="deposit-submit" />
      </ScrollView>

      <Modal visible={!!order} animationType="slide" onRequestClose={() => setOrder(null)} testID="razorpay-modal">
        <View style={{ flex: 1, backgroundColor: colors.bg }}>
          <SafeAreaView edges={['top']}>
            <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12, borderBottomWidth: 1, borderBottomColor: colors.borderSubtle }}>
              <TouchableOpacity onPress={() => setOrder(null)} testID="close-rzp"><Ionicons name="close" size={26} color="#fff" /></TouchableOpacity>
              <Text style={{ fontSize: 16, fontWeight: '800' }}>Razorpay Checkout</Text>
            </View>
          </SafeAreaView>
          {order && (
            <WebView
              originWhitelist={['*']}
              source={{ html: buildCheckoutHtml(order), baseUrl: 'https://checkout.razorpay.com' }}
              onMessage={(e) => onMessage(e.nativeEvent.data)}
              javaScriptEnabled
              domStorageEnabled
              style={{ flex: 1, backgroundColor: colors.bg }}
              startInLoadingState
              renderLoading={() => (
                <View style={{ position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center' }}>
                  <ActivityIndicator color={colors.primary} size="large" />
                </View>
              )}
            />
          )}
          {verifying && (
            <View style={st.overlay} testID="verifying-overlay">
              <ActivityIndicator color={colors.primary} size="large" />
              <Text style={{ marginTop: 12, fontWeight: '800' }}>Verifying payment…</Text>
            </View>
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  quick: { paddingHorizontal: 18, paddingVertical: 10, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderSubtle, borderRadius: 999 },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(5,5,10,0.95)', alignItems: 'center', justifyContent: 'center' },
});
