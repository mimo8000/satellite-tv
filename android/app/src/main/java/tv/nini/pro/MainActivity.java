package tv.nini.pro;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import tv.nini.pro.download.DownloadPlugin;
import tv.nini.pro.download.StreamProxyPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(DownloadPlugin.class);
        registerPlugin(StreamProxyPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
