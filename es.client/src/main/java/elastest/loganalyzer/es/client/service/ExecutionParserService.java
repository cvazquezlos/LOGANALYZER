package elastest.loganalyzer.es.client.service;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.context.support.ClassPathXmlApplicationContext;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import elastest.loganalyzer.es.client.model.Log;
import elastest.loganalyzer.es.client.model.Project;

@Service
public class ExecutionParserService {

	private final ESLogService esLogService;

	@Autowired
	public ExecutionParserService(ESLogService esLogService) {
		this.esLogService = esLogService;
		String timestamp = "(((\\d+).)+)";
		String level = "(\\w+)";
		String thread = "((\\S*)((\\w+)|((\\s+)(\\w+)))(\\S*))";
		String logger = "(((\\w+).)+)";
		String message = "(.*)";
		String spaces = "(\\s+)";
		String noSpaces = "(\\S+)";
		String divider = "(\\S*)";
		String pattern = "^" + timestamp + spaces + level + spaces + noSpaces + spaces + divider + thread + divider
				+ spaces + logger + spaces + divider + spaces + message + "$";
		Pattern target = Pattern.compile(pattern);
		// String pattern =
		// "^((((\\d+).)+)(\\s)(\\w+)(\\s+)(\\S+)(\\s)((\\S*)((\\w+)|((\\s+)(\\w+)))(\\S*))(\\s*)(((\\w+).)+)(\\s*)(\\S*)(\\s*)(.*))$";
		String str = "2018-02-20 12:30:48.199  INFO   --- [           main] io.github.bonigarcia.wdm.BrowserManager  : Exporting webdriver.gecko.driver as /home/pablo/.m2/repository/webdriver/geckodriver/linux64/0.19.1/geckodriver";
		Matcher matcher = target.matcher(str);
		if (matcher.find()) {
			System.out.println(matcher.group(1));
			System.out.println(matcher.group(5));
			System.out.println(matcher.group(12));
			System.out.println(matcher.group(20));
			System.out.println(matcher.group(26));
		}
		pattern = "^Running" + spaces + message + "$";
		Pattern starting = Pattern.compile(pattern);
		str = "Running com.fullteaching.backend.e2e.FullTeachingTestE2EChat";
		matcher = starting.matcher(str);
		if (matcher.find()) {
			System.out.println(matcher.group(2));
		}
		String basicSymbols = "((\\[)|(\\-)|(\\s{1})|(\\r)|(\n))";
		pattern = "^" + basicSymbols + message + "$";
		Pattern maven = Pattern.compile(pattern);
		str = "[INFO] Scanning for projects...";
		matcher = maven.matcher(str);
		if (matcher.find()) {
			System.out.println(matcher.group(2));
		}
	}

	public void parse(List<String> dirtyData, Project project, int lastId) throws Exception, IOException {
		ArrayList<String> data = new ArrayList<>();
		for (int i = 0; i < dirtyData.size(); i++) {
			data.add(dirtyData.get(i).replaceAll("\n", ""));
		}
		int numExecs = project.getNum_execs();
		data.add(0, "[INFO] Building project and starting unit test number " + numExecs + "...");
		data.add("[INFO] Finishing unit test number " + numExecs + "...");

		String testNumber = String.format("%02d", numExecs);
		Integer identificator = lastId;
		while (data.get(0).indexOf("[") == 0) {
			String id = String.format("%04d", identificator);
			String[] args = getArgsNormal(data.get(0));
			Log log = new Log(id, project.getName(), testNumber, data.get(0), args[0], args[1]);
			esLogService.save(log);
			System.out.println(data.get(0));
			data.remove(0);
			identificator++;
		}
		while (data.get(0).indexOf("R") != 0) {
			String id = String.format("%04d", identificator);
			Log log = new Log(id, project.getName(), testNumber, data.get(0), data.get(0));
			esLogService.save(log);
			System.out.println(data.get(0));
			data.remove(0);
			identificator++;
		}
		String method = "";
		while (data.get(0).length() != 0) {
			if (data.get(0).indexOf("S") == 0) {
				String id = String.format("%04d", identificator);
				Log log = new Log(id, project.getName(), testNumber, data.get(0), data.get(0));
				esLogService.save(log);
				System.out.println(data.get(0));
				method = data.get(0).split(" ")[1];
				data.remove(0);
				identificator++;
			} else if (data.get(0).indexOf("2") == 0) {
				String id = String.format("%04d", identificator);
				String[] args = getArgsLogback(data.get(0));
				Log log = new Log(id, project.getName(), testNumber, data.get(0), method, args[0], args[1], args[2],
						args[3], args[4]);
				esLogService.save(log);
				System.out.println(data.get(0));
				data.remove(0);
				identificator++;
			} else if (data.get(0).indexOf("[") == 0) {
				data.remove(0);
			} else {
				method = "-";
				String id = String.format("%04d", identificator);
				Log log = new Log(id, project.getName(), testNumber, data.get(0), data.get(0));
				esLogService.save(log);
				System.out.println(data.get(0));
				data.remove(0);
				identificator++;
			}
		}
		while (!data.isEmpty()) {
			String id = String.format("%04d", identificator);
			String[] args = getArgsNormal(data.get(0));
			Log log = new Log(id, project.getName(), testNumber, data.get(0), args[0], args[1]);
			esLogService.save(log);
			System.out.println(data.get(0));
			data.remove(0);
			identificator++;
		}
	}

	private static String[] getArgsLogback(String string) {
		String[] args = new String[5];
		String[] data = string.split(" ");
		args[0] = data[0] + " " + data[1];
		args[1] = data[2].replace("[", "").replace("]", "");
		args[2] = data[3];
		args[3] = data[5];
		args[4] = data[7];
		for (int i = 8; i < data.length; i++) {
			args[4] += " " + data[i];
		}
		return args;
	}

	private static String[] getArgsNormal(String string) {
		String[] args = new String[5];
		String[] data = string.split(" ");
		args[0] = data[0].replace("[", "").replace("]", "");
		if (data.length != 1) {
			args[1] = data[1];
			for (int i = 2; i < data.length; i++) {
				args[1] += " " + data[i];
			}
		} else {
			args[1] = "";
		}
		return args;
	}
	
	public List<String> getStreamByUrl(String url) throws IOException {
		@SuppressWarnings("resource")
		ApplicationContext appContext = new ClassPathXmlApplicationContext();
		Resource resource = appContext.getResource(url);
		
		InputStream is = resource.getInputStream();
		BufferedReader br = new BufferedReader(new InputStreamReader(is));
		List<String> data = new ArrayList<>();
		String line;
		while ((line = br.readLine()) != null) {
			data.add(line);
		}
		br.close();
		return data;
	}

	public List<String> getStreamByFile(MultipartFile file) throws IOException, Exception {
		List<String> data = new ArrayList<>(
				Arrays.asList((new String(file.getBytes(), "UTF-8")).split(System.getProperty("line.separator"))));
		return data;
	}
}