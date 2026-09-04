package tv.nini.pro;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import tv.nini.pro.download.DownloadPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(DownloadPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
